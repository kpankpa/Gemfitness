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
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { $Enums } from '@prisma/client';
import { paystackService } from '@/lib/services/paystack';
import { verifySessionForApi } from '@/lib/auth/dal';
import { z } from 'zod';

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
  plan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  
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
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: parsed.error.issues 
      }, { status: 400 });
    }

    const data = parsed.data;

    // Auto-generate password if not provided
    const password = data.password || `GYM${Math.random().toString(36).slice(-8).toUpperCase()}${Math.floor(Math.random() * 100)}`;
    const hashedPassword = await hash(password, 12);

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Handle payment based on method
    if (data.paymentMethod === 'CASH') {
      // CASH: Create pending registration marked as success
      const cashRef = paystackService.generateReference('CASH');
      
      const pendingReg = await prisma.pendingRegistration.create({
        data: {
          ...data,
          password: hashedPassword,
          paymentReference: cashRef,
          paymentStatus: 'success',
          dateOfBirth: new Date(data.dateOfBirth),
          registrationType: 'WALK_IN',
          expiresAt,
          address: data.address || '',
          fitnessGoals: data.fitnessGoals || '',
          medicalConditions: data.medicalConditions || '',
          otherConditionsDetails: data.otherConditionsDetails || '',
          momoReference: data.momoReference || null,
        }
      });

      // Immediately complete registration for cash payments
      const result = await completeRegistration(pendingReg.id);

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
            staff_id: session.userId || 'unknown',
          }
        );

        // Create pending registration
        const pendingReg = await prisma.pendingRegistration.create({
          data: {
            ...data,
            password: hashedPassword,
            paymentReference: momoRef,
            paymentStatus: 'pending',
            dateOfBirth: new Date(data.dateOfBirth),
            registrationType: 'WALK_IN',
            expiresAt,
            address: data.address || '',
            fitnessGoals: data.fitnessGoals || '',
            medicalConditions: data.medicalConditions || '',
            otherConditionsDetails: data.otherConditionsDetails || '',
            momoReference: momoRef,
          }
        });

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
    return NextResponse.json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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

  // Create user
  const user = await prisma.user.create({
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

  // Generate QR code
  const { generateMemberQRCode } = await import('@/lib/qr/generator');
  const qrCodeResult = await generateMemberQRCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { qrCode: qrCodeResult.token }
  });

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
  const planPrices = {
    'ONE_MONTH': 200,
    'THREE_MONTHS': 500,
    'ONE_YEAR': 2200
  };

  const planDurations = {
    'ONE_MONTH': 30,
    'THREE_MONTHS': 90,
    'ONE_YEAR': 365
  };

  const amount = planPrices[pending.plan as keyof typeof planPrices];
  const duration = planDurations[pending.plan as keyof typeof planDurations];

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + duration);

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

  // Delete pending registration
  await prisma.pendingRegistration.delete({
    where: { id: pending.id }
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      qrCode: `GYM|${qrCodeResult.token}`,
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
