/**
 * WALK-IN MEMBER REGISTRATION API
 * 
 * Handles walk-in member registration with proper Paystack integration:
 * - Cash: Creates pending registration, marks as paid immediately
 * - MoMo: Initializes Paystack, sends USSD to customer, waits for webhook
 * 
 * Flow:
 * 1. Receptionist submits form with all member data
 * 2. System creates PendingRegistration record
 * 3. If CASH: Mark as success, create user immediately
 * 4. If MOMO: Call Paystack API, customer receives USSD prompt
 * 5. Webhook confirms payment → create user from pending registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { $Enums, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';
import { verifySessionForApi } from '@/lib/auth/dal';
import { ReceiptEmailService } from '@/lib/services/payment/receipt-generator';

const walkInRegistrationSchema = z.object({
  // Basic info
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  dateOfBirth: z.string(),
  address: z.string().optional(),
  
  // Emergency contact
  emergencyContact: z.string().min(2),
  emergencyPhone: z.string().min(7),
  
  // PAR-Q
  hasHeartCondition: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  hasChestPain: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  hasDizziness: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  hasJointProblems: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  takesMedication: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  hasOtherConditions: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  otherConditionsDetails: z.string().optional(),
  
  // Additional
  fitnessGoals: z.string().optional(),
  medicalConditions: z.string().optional(),
  
  // Membership
  plan: z.enum(['DAILY', 'ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  
  // Payment
  paymentMethod: z.enum(['CASH', 'MOMO']),
  amountPaid: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  momoReference: z.string().optional(),
  
  // Auto-generated password (optional, will be generated if not provided)
  password: z.string().optional(),
});

// POST /api/members/walk-in - Create walk-in registration
export async function POST(request: NextRequest) {
  try {
    // Auth: require staff
    const session = await verifySessionForApi();
    if (!session?.isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    let body: unknown;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = {} as Record<string, string>;
      for (const [k, v] of form.entries()) {
        (body as Record<string, string>)[k] = String(v);
      }
    } else {
      body = await request.json();
    }

    const parsed = walkInRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      console.error('❌ Walk-in validation failed:', parsed.error.issues);
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    const data = parsed.data;
    console.log('✅ Walk-in registration validated:', {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      plan: data.plan,
      paymentMethod: data.paymentMethod,
      amountPaid: data.amountPaid
    });

    // Check for duplicate email/phone in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone }
        ]
      }
    });

    if (existingUser) {
      const duplicateFields = [];
      if (existingUser.email === data.email) duplicateFields.push('email');
      if (existingUser.phone === data.phone) duplicateFields.push('phone');
      
      console.log('❌ Duplicate user found:', { fields: duplicateFields });
      return NextResponse.json({ 
        error: 'User already exists', 
        fields: duplicateFields 
      }, { status: 409 });
    }

    // Check for duplicate email in PendingRegistration table
    const existingPending = await prisma.pendingRegistration.findFirst({
      where: { email: data.email }
    });

    if (existingPending) {
      const now = new Date();
      let shouldDelete = false;

      if (existingPending.expiresAt <= now) {
        // Expired pending registration
        shouldDelete = true;
        console.log('🗑️ Deleting expired pending registration:', data.email);
      } else if (existingPending.paymentStatus === 'success') {
        // Marked as success but no user was created (orphaned from failed completeRegistration)
        const userExists = await prisma.user.findFirst({
          where: { email: data.email }
        });
        if (!userExists) {
          shouldDelete = true;
          console.log('🗑️ Deleting orphaned pending registration (success but no user):', data.email);
        }
      }

      if (shouldDelete) {
        await prisma.pendingRegistration.delete({
          where: { id: existingPending.id }
        });
      } else {
        // Still valid and active - block new registration
        console.log('❌ Active pending registration exists for email:', data.email, {
          status: existingPending.paymentStatus,
          expiresAt: existingPending.expiresAt
        });
        return NextResponse.json({ 
          error: 'Registration already in progress for this email', 
          fields: ['email'],
          message: existingPending.paymentStatus === 'pending' 
            ? 'A mobile money payment is pending for this email. Please complete or wait for it to expire.'
            : 'A registration is being processed for this email.'
        }, { status: 409 });
      }
    }

    // Auto-generate password if not provided
    const password = data.password || `GYM${Math.random().toString(36).slice(-8).toUpperCase()}${Math.floor(Math.random() * 100)}`;
    const hashedPassword = await hash(password, 12);

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Handle payment based on method
    if (data.paymentMethod === 'CASH') {
      console.log('💵 Processing CASH payment for walk-in registration');
      // CASH: Create pending registration marked as success
      const cashRef = paystackService.generateReference('CASH');
      
      let pendingReg;
      try {
        pendingReg = await prisma.pendingRegistration.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            dateOfBirth: new Date(data.dateOfBirth),
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            hasHeartCondition: data.hasHeartCondition,
            hasChestPain: data.hasChestPain,
            hasDizziness: data.hasDizziness,
            hasJointProblems: data.hasJointProblems,
            takesMedication: data.takesMedication,
            hasOtherConditions: data.hasOtherConditions,
            otherConditionsDetails: data.otherConditionsDetails || '',
            plan: data.plan,
            paymentMethod: data.paymentMethod,
            amountPaid: data.amountPaid,
            momoReference: data.momoReference || null,
            address: data.address || '',
            fitnessGoals: data.fitnessGoals || '',
            medicalConditions: data.medicalConditions || '',
            password: hashedPassword,
            paymentReference: cashRef,
            paymentStatus: 'success',
            registrationType: 'WALK_IN',
            expiresAt,
          }
        });
      } catch (err: unknown) {
        console.error('❌ Failed to create pending registration:', err);
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const target = (err.meta && (err.meta.target || err.meta['target'])) || ['email'];
          return NextResponse.json({ 
            error: 'Duplicate registration data', 
            fields: Array.isArray(target) ? target : [target] 
          }, { status: 409 });
        }
        throw err;
      }

      // Immediately complete registration for cash payments
      let result;
      try {
        result = await completeRegistration(pendingReg.id);
        console.log('✅ CASH walk-in registration completed:', {
          userId: result.user.id,
          reference: cashRef
        });
      } catch (completeError) {
        // Clean up the pending registration so user can retry
        console.error('❌ completeRegistration failed, cleaning up pending record:', completeError);
        await prisma.pendingRegistration.delete({ where: { id: pendingReg.id } }).catch(() => {});
        return NextResponse.json({
          error: 'Registration failed during account creation',
          message: completeError instanceof Error ? completeError.message : 'Unknown error'
        }, { status: 500 });
      }

      
      return NextResponse.json({
        success: true,
        payment_method: 'CASH',
        reference: cashRef,
        password, // Return plain password for receipt
        user: result.user,
      });

    } else {
      // MOMO: Initialize Paystack payment
      const formattedPhone = paystackService.formatPhoneNumber(data.phone);
      const provider = paystackService.detectMoMoProvider(formattedPhone);

      if (!provider) {
        return NextResponse.json({
          error: 'Invalid mobile money number',
          message: 'Could not detect provider from phone number'
        }, { status: 400 });
      }

      try {
        // Generate payment reference
        const momoRef = paystackService.generateReference('MOMO');

        // Initialize Paystack Mobile Money
        const momoPayment = await paystackService.initializeMobileMoneyPayment(
          data.email,
          data.amountPaid,
          formattedPhone,
          momoRef,
          {
            member_name: `${data.firstName} ${data.lastName}`,
            plan: data.plan,
            registration_type: 'WALK_IN',
            channel: 'walk_in_registration',
            staff_id: session.userId || 'unknown',
          }
        );

        // Create pending registration
        let pendingReg;
        try {
          pendingReg = await prisma.pendingRegistration.create({
            data: {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              dateOfBirth: new Date(data.dateOfBirth),
              emergencyContact: data.emergencyContact,
              emergencyPhone: data.emergencyPhone,
              hasHeartCondition: data.hasHeartCondition,
              hasChestPain: data.hasChestPain,
              hasDizziness: data.hasDizziness,
              hasJointProblems: data.hasJointProblems,
              takesMedication: data.takesMedication,
              hasOtherConditions: data.hasOtherConditions,
              otherConditionsDetails: data.otherConditionsDetails || '',
              plan: data.plan,
              paymentMethod: data.paymentMethod,
              amountPaid: data.amountPaid,
              momoReference: momoRef,
              address: data.address || '',
              fitnessGoals: data.fitnessGoals || '',
              medicalConditions: data.medicalConditions || '',
              password: hashedPassword,
              paymentReference: momoRef,
              paymentStatus: 'pending',
              registrationType: 'WALK_IN',
              expiresAt,
            }
          });
        } catch (err: unknown) {
          console.error('❌ Failed to create pending registration:', err);
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            const target = (err.meta && (err.meta.target || err.meta['target'])) || ['email'];
            return NextResponse.json({ 
              error: 'Duplicate registration data', 
              fields: Array.isArray(target) ? target : [target] 
            }, { status: 409 });
          }
          throw err;
        }

        return NextResponse.json({
          success: true,
          payment_method: 'MOMO',
          reference: momoRef,
          message: 'USSD prompt sent to customer phone',
          status: 'pending',
          pending_id: pendingReg.id,
          provider: momoPayment.provider.toUpperCase(),
        });

      } catch (error) {
        console.error('Paystack MoMo initialization error:', error);
        return NextResponse.json({
          error: 'Payment initialization failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Walk-in registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Walk-in registration error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({
      error: 'Registration failed',
      message: errorMessage,
      details: errorStack?.split('\n').slice(0, 3).join(' ') || 'No stack trace'
    }, { status: 500 });
  }
}

// GET /api/members/walk-in?reference=XXX - Check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    // Check pending registration
    const pendingReg = await prisma.pendingRegistration.findUnique({
      where: { paymentReference: reference }
    });

    if (!pendingReg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // If already success, check if user was created
    if (pendingReg.paymentStatus === 'success') {
      const user = await prisma.user.findUnique({
        where: { email: pendingReg.email }
      });

      if (user) {
        return NextResponse.json({
          status: 'completed',
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            qrCode: user.qrCode,
          }
        });
      }
    }

    // For MoMo, verify with Paystack
    if (pendingReg.paymentMethod === 'MOMO' && pendingReg.paymentStatus === 'pending') {
      try {
        const verification = await paystackService.verifyPayment(reference);
        const verifyData = verification.data as { status: string };

        if (verification.status && verifyData.status === 'success') {
          // Update pending registration
          await prisma.pendingRegistration.update({
            where: { id: pendingReg.id },
            data: { paymentStatus: 'success' }
          });

          return NextResponse.json({
            status: 'success',
            message: 'Payment confirmed',
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
    }

    return NextResponse.json({
      status: pendingReg.paymentStatus,
      payment_method: pendingReg.paymentMethod,
      reference: pendingReg.paymentReference,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

// Helper: Complete registration from pending
async function completeRegistration(pendingId: string) {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingId }
  });

  if (!pending) {
    throw new Error('Pending registration not found');
  }

  // Check if user already exists (day pass holder upgrading to full member)
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: pending.email },
        { phone: pending.phone }
      ]
    }
  });

  if (user) {
    // Existing user found - update their record instead of creating new
    console.log(`📝 Updating existing user (day pass → full member): ${user.id}`);
    
    // Check if they have a placeholder email (day pass user)
    const isPlaceholderEmail = user.email.includes('@gemfitness.local');
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        // Update to real email if they had placeholder
        ...(isPlaceholderEmail && { email: pending.email }),
        // Update other fields
        firstName: pending.firstName,
        lastName: pending.lastName,
        password: pending.password,
        dateOfBirth: pending.dateOfBirth,
        address: pending.address || user.address,
        fitnessGoals: pending.fitnessGoals || user.fitnessGoals,
        medicalConditions: pending.medicalConditions || user.medicalConditions,
        emergencyContact: pending.emergencyContact,
        emergencyPhone: pending.emergencyPhone,
        registrationPaid: true,
        passwordSet: true,
        emailVerified: true,
      }
    });
  } else {
    // Create new user
    user = await prisma.user.create({
      data: {
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        phone: pending.phone,
        password: pending.password,
        role: $Enums.UserRole.MEMBER,
        qrCode: '', // Will be updated after creation
        registrationType: $Enums.RegistrationType.WALK_IN,
        registrationPaid: true,
        emergencyContact: pending.emergencyContact,
        emergencyPhone: pending.emergencyPhone,
        dateOfBirth: pending.dateOfBirth,
        address: pending.address || '',
        fitnessGoals: pending.fitnessGoals || '',
        medicalConditions: pending.medicalConditions || '',
      }
    });
  }

  // Generate QR code (only if user doesn't have one yet)
  if (!user.qrCode) {
    const { generateMemberQRCode } = await import('@/lib/qr/generator');
    const qrCodeResult = await generateMemberQRCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrCodeResult.token }
    });
    user.qrCode = qrCodeResult.token;
  }

  // Create PAR-Q response
  const yesCount = [
    pending.hasHeartCondition,
    pending.hasChestPain,
    pending.hasDizziness,
    pending.hasJointProblems,
    pending.takesMedication,
    pending.hasOtherConditions
  ].filter(Boolean).length;
  
  const riskLevel = yesCount === 0 ? 'LOW' : yesCount <= 2 ? 'MEDIUM' : 'HIGH';

  await prisma.parQResponse.create({
    data: {
      userId: user.id,
      responses: JSON.stringify({
        hasHeartCondition: pending.hasHeartCondition,
        hasChestPain: pending.hasChestPain,
        hasDizziness: pending.hasDizziness,
        hasJointProblems: pending.hasJointProblems,
        takesMedication: pending.takesMedication,
        hasOtherConditions: pending.hasOtherConditions,
      }),
      otherReasonDetails: pending.otherConditionsDetails || '',
      riskLevel,
      completedAt: new Date(),
    }
  });

  // Update user PAR-Q status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      parqCompleted: true,
      parqCompletedAt: new Date(),
      parqRiskLevel: riskLevel,
    }
  });

  // Create subscription
    const planPrices: Record<string, number> = {
      'DAILY': 30,
      'ONE_MONTH': 200,
      'THREE_MONTHS': 500,
      'ONE_YEAR': 1800
    };

    const planDurations: Record<string, number> = {
      'DAILY': 1,
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'ONE_YEAR': 365
    };

  const amount = planPrices[pending.plan as keyof typeof planPrices];
  const duration = planDurations[pending.plan as keyof typeof planDurations];

  const startDate = new Date();
  let endDate: Date;
  if (pending.plan === 'DAILY') {
    // Day pass expires at end of day (midnight)
    endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59, 999);
  } else {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: pending.plan as $Enums.MembershipPlan,
      amount,
      startDate,
      endDate,
      status: 'ACTIVE',
      registrationType: $Enums.RegistrationType.WALK_IN
    }
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      amount: pending.amountPaid,
      paymentMethod: pending.paymentMethod,
      paymentDate: new Date(),
      reference: pending.paymentReference,
      status: 'SUCCESS'
    }
  });

  // Create comprehensive payment transaction record
  const paymentTransaction = await prisma.paymentTransaction.create({
    data: {
      userId: user.id,
      reference: pending.paymentReference,
      amount: pending.amountPaid,
      currency: 'GHS',
      status: 'success',
      paymentMethod: pending.paymentMethod.toLowerCase(),
      transactionType: 'subscription',
      relatedEntityId: subscription.id,
      relatedEntityType: 'subscription',
      metadata: {
        plan: pending.plan,
        registrationType: 'WALK_IN',
        processedAt: new Date().toISOString(),
        staffProcessed: true
      },
      paidAt: new Date(),
    }
  });

  // Send receipt email
  try {
    const { sendReceiptEmail } = await import('@/lib/services/email/receipt-email');
    const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/receipt/${paymentTransaction.id}`;
    await sendReceiptEmail({
      memberName: `${user.firstName} ${user.lastName}`,
      memberEmail: user.email,
      transactionId: paymentTransaction.id,
      reference: pending.paymentReference,
      amount: pending.amountPaid,
      currency: 'GHS',
      paymentMethod: pending.paymentMethod.toLowerCase(),
      plan: pending.plan,
      transactionDate: new Date(),
      receiptUrl,
    });
  } catch (emailError) {
    console.error('Failed to send receipt email:', emailError);
    // Don't fail registration if email fails
  }

  // Delete pending registration
  await prisma.pendingRegistration.delete({
    where: { id: pending.id }
  });

  // Send payment receipt email (async, don't wait)
  ReceiptEmailService.sendReceiptEmail(paymentTransaction.id).catch(error => {
    console.error('❌ Walk-in receipt email failed:', { transactionId: paymentTransaction.id, error });
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      qrCode: `GYM|${user.qrCode}`,
      plan: pending.plan,
      emergencyContact: pending.emergencyContact,
      emergencyPhone: pending.emergencyPhone,
      paymentMethod: pending.paymentMethod,
      amountPaid: pending.amountPaid,
      momoReference: pending.momoReference,
      parqCompleted: true,
      parqRiskLevel: riskLevel,
    }
  };
}
