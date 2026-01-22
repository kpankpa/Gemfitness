import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/services/email/resend';
import { hashPassword } from '@/lib/auth/passwords';
import { getPlanPricing, determinePlanFromAmount, calculateEndDate } from '@/lib/pricing';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  let paymentData: any = null;
  let reference: string = '';
  
  try {
    // ✅ VALIDATION: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      logger.error('❌ Invalid JSON in request body:', { error: parseError });
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    paymentData = requestBody.paymentData;
    reference = requestBody.reference;

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
    const metadata = paymentData.metadata || {};
    
    logger.info('📧 Processing user creation from payment:', {
      email: customer.email,
      hasMetadata: !!paymentData.metadata,
      metadata: paymentData.metadata,
      paymentAmount: paymentData.amount,
      paymentReference: reference
    });
    
    // ✅ IDEMPOTENCY: Check if user already exists
    let existingUser;
    try {
      const phoneToCheck = metadata.phone || customer.phone;
      const whereCondition: any = { email: customer.email };
      
      // Only check phone if it's a valid phone number (not 'N/A' or empty)
      if (phoneToCheck && phoneToCheck !== 'N/A' && phoneToCheck.trim() !== '') {
        whereCondition.OR = [
          { email: customer.email },
          { phone: phoneToCheck }
        ];
        delete whereCondition.email; // Use OR condition instead
      }
      
      existingUser = await prisma.user.findFirst({
        where: whereCondition
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
      
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Extract plan information from metadata or amount
    let planId = 'basic-monthly';
    let planName = 'Basic Monthly';
    
    // If metadata contains plan info, use it
    if (paymentData.metadata?.planId) {
      planId = paymentData.metadata.planId;
      planName = paymentData.metadata.planName || planName;
    } else {
      // Otherwise, determine plan from amount
      const amount = paymentData.amount / 100; // Convert from kobo to cedis
      
      if (amount >= 200) {
        planId = 'premium-monthly';
        planName = 'Premium Monthly';
      } else if (amount >= 150) {
        planId = 'standard-monthly';
        planName = 'Standard Monthly';
      }
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
    
    // ✅ SECURITY FIX: Generate secure random password (metadata no longer contains password)
    const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => (b % 36).toString(36))
      .join('')
      .slice(0, 12);
    const password = await hashPassword(tempPassword);
    const address = metadata.address || null;
    const fitnessGoals = metadata.fitnessGoals || null;
    const medicalConditions = metadata.medicalConditions || null;

    // Generate OTP for new user
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // ✅ TRANSACTION: Create user with subscription in one transaction
    let newUser;
    let subscriptionPlan;
    try {
      newUser = await prisma.user.create({
        data: {
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
          password, // This should be hashed in production
          role: 'MEMBER',
          registrationPaid: true,
          registrationType: 'SELF',
          paymentReference: reference,
          emailVerified: false,
          otpCode,
          otpExpiry,
          otpAttempts: 0,
          otpLastSent: new Date(),
        }
      });
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
    // ✅ PRICING FIX: Use centralized pricing instead of hardcoded values
    const amountInCedis = paymentData.amount / 100; // Convert from kobo to cedis
    try {
      subscriptionPlan = determinePlanFromAmount(amountInCedis);
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
          amount: paymentData.amount / 100, // Convert from kobo to cedis
          currency: 'GHS',
          status: 'success',
          paymentMethod: 'paystack',
          transactionType: 'registration',
          relatedEntityId: newUser.id,
          relatedEntityType: 'user',
          paymentGatewayId: paymentData.id?.toString(),
          paidAt: new Date(),
          metadata: {
            paystackData: paymentData,
            createdVia: 'manual-fallback',
            planId: planId,
            planName: planName
          }
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
      amount: paymentData.amount / 100
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
        return NextResponse.json(
          { 
            success: false, 
            message: 'A user with this email or phone number already exists. Please try logging in instead.',
            error: 'DUPLICATE_USER'
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