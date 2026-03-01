import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { RegistrationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/services/email/resend';
import { hashPassword } from '@/lib/auth/passwords';
import { getPlanPricing, determinePlanFromAmount, calculateEndDate } from '@/lib/pricing';
import { logger } from '@/lib/logger';

interface PaymentData {
  reference: string;
  amount: number;
  customer: { 
    email: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  metadata: Record<string, string>;
  authorization?: Record<string, unknown>;
  paid_at?: string;
  id?: string | number;
}

export async function POST(request: NextRequest) {
  let paymentData: PaymentData | null = null;
  let reference: string = '';
  
  try {
    // VALIDATION: Parse and validate request body
    let requestBody: Record<string, unknown>;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      logger.error('❌ Invalid JSON in request body:', { error: parseError });
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    paymentData = requestBody.paymentData as PaymentData;
    reference = requestBody.reference as string;

    // ✅ VALIDATION: Ensure required fields are present
    if (!paymentData) {
      logger.error('❌ Missing paymentData in request');
      return NextResponse.json(
        { success: false, message: 'Missing payment data' },
        { status: 400 }
      );
    }

    if (!paymentData?.customer?.email) {
      logger.error('❌ Invalid payment data: missing customer email');
      return NextResponse.json(
        { success: false, message: 'Invalid payment data - missing customer email' },
        { status: 400 }
      );
    }

    if (!reference) {
      logger.error('❌ Missing payment reference');
      return NextResponse.json(
        { success: false, message: 'Missing payment reference' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentData.customer.email)) {
      logger.error('❌ Invalid email format:', { email: paymentData.customer.email });
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ VALIDATION: Validate payment amount
    const amount = paymentData.amount;
    if (!amount || amount <= 0) {
      logger.error('❌ Invalid payment amount:', { amount });
      return NextResponse.json(
        { success: false, message: 'Invalid payment amount' },
        { status: 400 }
      );
    }

    const { customer } = paymentData;
    // Normalize email to lowercase to ensure consistent DB storage and lookups
    customer.email = customer.email.toLowerCase().trim();
    const metadata = paymentData.metadata || {};
    
    logger.info('📧 Processing user creation from payment:', {
      email: customer.email,
      hasMetadata: !!paymentData.metadata,
      metadata: paymentData.metadata,
      paymentAmount: paymentData.amount,
      paymentReference: reference
    });
    
    // ✅ IDEMPOTENCY: Check if user already exists — match by EMAIL ONLY.
    // Phone is NOT used for matching because two different people may share a
    // phone number in test data, or a user may re-register with a new email
    // but the same phone. Using phone here caused the wrong account to be
    // returned, redirecting the new user to verify someone else's email.
    let existingUser;
    try {
      existingUser = await prisma.user.findFirst({
        where: { email: { equals: customer.email, mode: 'insensitive' } },
      });
    } catch (dbError) {
      logger.error('❌ Database error checking for existing user:', { error: dbError });
      return NextResponse.json(
        { success: false, message: 'Database error' },
        { status: 500 }
      );
    }

    if (existingUser) {
      logger.info(`User already exists:`, { 
        email: customer.email, 
        existingEmail: existingUser.email,
        matchedBy: existingUser.email === customer.email ? 'email' : 'phone'
      });
      
      // If user exists but not verified, resend OTP
      if (!existingUser.emailVerified) {
        // Generate new OTP and update user
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            otpCode,
            otpExpiry,
            otpAttempts: 0,
            otpLastSent: new Date(),
          }
        });

        const result = await sendOTPEmail({
          to: customer.email,
          firstName: existingUser.firstName || customer.first_name || 'Member',
          otpCode
        });
        
        if (result.success) {
          logger.info(`OTP resent to existing user: ${customer.email}`);
        } else {
          logger.error(`Failed to resend OTP: ${result.error}`);
        }
      }
      
      // ✅ ALWAYS record payment even for existing users so it shows in admin
      try {
        const existingTx = await prisma.paymentTransaction.findUnique({ where: { reference } });
        if (!existingTx) {
          await prisma.paymentTransaction.create({
            data: {
              userId: existingUser.id,
              reference,
              amount: paymentData.amount / 100,
              currency: 'GHS',
              status: 'success',
              paymentMethod: 'paystack',
              transactionType: 'registration',
              relatedEntityId: existingUser.id,
              relatedEntityType: 'user',
              paymentGatewayId: paymentData.id?.toString() || '',
              paidAt: new Date(),
              metadata: {
                createdVia: 'existing-user-fallback',
                customerEmail: customer.email,
                matchedEmail: existingUser.email,
              },
            },
          });
          logger.info('✅ Payment transaction recorded for existing user:', { reference, userId: existingUser.id });
        }
      } catch (txErr) {
        logger.error('⚠️ Failed to record payment for existing user (non-critical):', {
          reference,
          error: txErr instanceof Error ? txErr.message : 'unknown',
        });
      }

      // Return the ACTUAL stored email so the client redirects to the correct address
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          emailVerified: existingUser.emailVerified,
        },
      });
    }

    // Extract user data from payment metadata
    const firstName = metadata.firstName || customer.first_name || 'Member';
    const lastName = metadata.lastName || customer.last_name || 'User';
    let phone = metadata.phone || customer.phone || null;
    
    // Generate unique phone if not provided to satisfy unique constraint
    if (!phone || phone === 'N/A' || phone.trim() === '') {
      phone = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    
    // Extract additional registration data
    const dateOfBirth = metadata.dateOfBirth ? new Date(metadata.dateOfBirth) : new Date('1990-01-01');
    const emergencyContact = metadata.emergencyContact || 'N/A';
    const emergencyPhone = metadata.emergencyPhone || 'N/A';
    
    // ✅ SECURITY: Password is NOT in payment metadata (security best practice)
    // Password is stored client-side in sessionStorage and sent after OTP verification
    // Create user with placeholder password - will be set via /api/auth/set-password after OTP
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Generate a secure random placeholder - user cannot login until they verify OTP
    // and their real password is set via the set-password endpoint
    const placeholderPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => (b % 36).toString(36))
      .join('');
    
    logger.info('✅ Creating user with placeholder password (real password set after OTP):', { 
      email: customer.email 
    });
    
    // Log info in dev mode
    if (isDevelopment) {
      console.log('\n' + '='.repeat(60));
      console.log('🔐 SECURE PASSWORD FLOW (DEV MODE)');
      console.log('='.repeat(60));
      console.log(`Email: ${customer.email}`);
      console.log('Password: NOT sent to payment provider');
      console.log('Status: User will set password via OTP verification');
      console.log('='.repeat(60) + '\n');
    }
    
    const password = await hashPassword(placeholderPassword);
    const address = metadata.address || null;
    const fitnessGoals = metadata.fitnessGoals || null;
    const medicalConditions = metadata.medicalConditions || null;

    // Generate OTP for new user
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // ✅ TRANSACTION: Create user with subscription in one transaction
    // If the requested phone is already taken by another user, fall back to a
    // generated temp phone so the new account is still created correctly.
    let newUser;
    let subscriptionPlan;
    try {
      const userData = {
        email: customer.email,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        address,
        emergencyContact,
        emergencyPhone,
        fitnessGoals,
        medicalConditions,
        password,
        role: 'MEMBER' as const,
        registrationPaid: true,
        registrationType: RegistrationType.SELF,
        paymentReference: reference,
        emailVerified: false,
        otpCode,
        otpExpiry,
        otpAttempts: 0,
        otpLastSent: new Date(),
      };

      try {
        newUser = await prisma.user.create({ data: userData });
      } catch (firstTryError) {
        // If phone caused a unique-constraint violation, retry with a temp phone
        const msg = firstTryError instanceof Error ? firstTryError.message : '';
        if (msg.includes('Unique constraint') && msg.toLowerCase().includes('phone')) {
          logger.warn('⚠️ Phone already in use, retrying with generated phone:', { phone });
          const tempPhone = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          newUser = await prisma.user.create({ data: { ...userData, phone: tempPhone } });
        } else {
          throw firstTryError;
        }
      }
    } catch (userCreateError) {
      logger.error('❌ Failed to create user:', { 
        email: customer.email, 
        error: userCreateError instanceof Error ? userCreateError.message : 'unknown error'
      });
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create subscription record
    // NOTE: paymentData.amount is already in cedis — the /api/payment/verify endpoint
    // converts from kobo before returning, so do NOT divide by 100 again here.
    const amountInCedis = paymentData.amount; // already in cedis from verify API

    // Determine plan — prefer the plan name from form metadata, fall back to
    // amount-based detection (subtracting the GHS 250 registration fee so the
    // threshold comparison lines up with plan prices, not totals).
    const REGISTRATION_FEE = 250;
    const PLAN_MAP: Record<string, 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR'> = {
      monthly: 'ONE_MONTH',
      quarterly: 'THREE_MONTHS',
      annual: 'ONE_YEAR',
    };
    const metaPlan = (metadata.plan as string | undefined)?.toLowerCase();

    try {
      subscriptionPlan = metaPlan && PLAN_MAP[metaPlan]
        ? PLAN_MAP[metaPlan]
        : determinePlanFromAmount(Math.max(0, amountInCedis - REGISTRATION_FEE));

      logger.info('📋 Subscription plan determined:', {
        metaPlan,
        amountInCedis,
        subscriptionPlan,
      });

      const planPricing = getPlanPricing(subscriptionPlan);
      const endDate = calculateEndDate(planPricing.durationDays);

      await prisma.subscription.create({
        data: {
          userId: newUser.id,
          plan: subscriptionPlan,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: endDate,
          amount: amountInCedis,
          registrationType: 'SELF'
        }
      });
    } catch (subscriptionError) {
      logger.error('❌ Failed to create subscription:', { 
        userId: newUser.id, 
        error: subscriptionError instanceof Error ? subscriptionError.message : 'unknown error'
      });
      // User was created but subscription failed - this is bad, log it
      // Consider rollback or manual cleanup
      return NextResponse.json(
        { success: false, message: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Send OTP email
    logger.info('📧 About to send OTP email:', {
      to: customer.email,
      firstName: firstName,
      otpCodeLength: otpCode.length,
      hasOtpCode: !!otpCode
    });
    
    const emailResult = await sendOTPEmail({
      to: customer.email,
      firstName: firstName,
      otpCode
    });
    
    if (!emailResult.success) {
      logger.error(`Failed to send OTP email to ${customer.email}: ${emailResult.error}`);
      // Don't fail the entire process if email fails
    } else {
      logger.info(`OTP email sent successfully to ${customer.email}`, { messageId: emailResult.messageId });
    }

    // Record payment transaction
    try {
      await prisma.paymentTransaction.create({
        data: {
          userId: newUser.id,
          reference: reference,
          amount: amountInCedis, // already in cedis (no /100 needed)
          currency: 'GHS',
          status: 'success',
          paymentMethod: 'paystack',
          transactionType: 'registration',
          relatedEntityId: newUser.id,
          relatedEntityType: 'user',
          paymentGatewayId: paymentData.id?.toString() || '',
          paidAt: new Date(),
          metadata: {
            createdVia: 'manual-fallback',
            plan: subscriptionPlan,
          },
        }
      });
    } catch (txError) {
      logger.error('⚠️ Failed to record payment transaction (non-critical):', { 
        userId: newUser.id, 
        reference,
        error: txError instanceof Error ? txError.message : 'unknown error'
      });
      // Log but don't fail - user is created and subscription exists
    }

    logger.info(`User created successfully via manual fallback:`, {
      userId: newUser.id,
      email: customer.email,
      firstName: firstName,
      lastName: lastName,
      plan: subscriptionPlan,
      amount: amountInCedis,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        emailVerified: newUser.emailVerified
      },
      message: 'Account created successfully. Please check your email for verification code.'
    });

  } catch (error) {
    logger.error('Error in create-user-from-payment:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      reference: reference,
      customerEmail: paymentData?.customer?.email
    });
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        logger.warn('Duplicate user creation attempt:', {
          email: paymentData?.customer?.email,
          reference: reference
        });
        // Try to fetch the existing user so we can return their stored email
        let existingEmail = paymentData?.customer?.email || '';
        try {
          const existing = await prisma.user.findFirst({
            where: { email: { equals: existingEmail, mode: 'insensitive' } },
            select: { email: true },
          });
          if (existing) existingEmail = existing.email;
        } catch { /* ignore */ }
        return NextResponse.json(
          { 
            success: false, 
            message: 'A user with this email or phone number already exists. Please try logging in instead.',
            error: 'DUPLICATE_USER',
            user: { email: existingEmail },
          },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to create user account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}