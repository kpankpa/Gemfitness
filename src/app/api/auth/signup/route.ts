import { NextRequest, NextResponse } from 'next/server';
import { signupSchema } from '@/lib/validation/schemas';
import { hashPassword } from '@/lib/auth/passwords';
import { generateMemberQRCode } from '@/lib/qr/generator';
import { prisma } from '@/lib/prisma';
import { initializePayment } from '@/lib/services/payment/mock';
import { sendWelcomeEmail } from '@/lib/services/email/mock';
import { createSession } from '@/lib/auth/session';
import logger, { logAuth, logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate QR code
    const { qrCodeString } = await generateMemberQRCode('temp-id');

    // Map plan to database enum
    const planMap: Record<string, 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR'> = {
      monthly: 'ONE_MONTH',
      quarterly: 'THREE_MONTHS',
      annual: 'ONE_YEAR',
    };

    const dbPlan = planMap[data.plan];

    // Calculate subscription dates and amount
    const startDate = new Date();
    const endDate = new Date();
    let amount = 0;

    switch (dbPlan) {
      case 'ONE_MONTH':
        endDate.setMonth(endDate.getMonth() + 1);
        amount = 200;
        break;
      case 'THREE_MONTHS':
        endDate.setMonth(endDate.getMonth() + 3);
        amount = 500;
        break;
      case 'ONE_YEAR':
        endDate.setFullYear(endDate.getFullYear() + 1);
        amount = 2200;
        break;
    }

    const registrationFee = 250;
    const totalAmount = amount + registrationFee;

    // Initialize mock payment
    const paymentReference = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentResult = await initializePayment({
      email: data.email,
      amount: totalAmount,
      reference: paymentReference,
      plan: data.plan,
      userId: 'pending',
    });

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: 'Payment initialization failed' },
        { status: 500 }
      );
    }

    // Create user, subscription, and payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address || null,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          fitnessGoals: data.fitnessGoals || null,
          medicalConditions: data.medicalConditions || null,
          dateOfBirth: new Date(data.dateOfBirth),
          role: 'MEMBER',
          qrCode: qrCodeString.replace('temp-id', ''), // Will update with actual user ID
        },
      });

      // Update QR code with actual user ID
      const actualQRCode = `GYM-${user.id}-${qrCodeString.split('-').pop()}`;
      await tx.user.update({
        where: { id: user.id },
        data: { qrCode: actualQRCode },
      });

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          plan: dbPlan,
          startDate,
          endDate,
          status: 'ACTIVE',
          amount,
          registrationType: 'SELF',
        },
      });

      // Record payment
      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: totalAmount,
          paymentDate: new Date(),
          paymentMethod: 'CARD',
          reference: paymentReference,
          status: 'SUCCESS',
        },
      });

      return { user, subscription, qrCode: actualQRCode };
    });

    logger.info('✅ User registered successfully', {
      userId: result.user.id,
      email: result.user.email,
      plan: dbPlan,
    });

    logAuth('SIGNUP', result.user.id, {
      email: result.user.email,
      plan: dbPlan,
    });

    // Send welcome email (mock)
    await sendWelcomeEmail(
      result.user.email,
      result.user.firstName,
      result.qrCode
    );

    // Create session and log user in
    await createSession(result.user.id, result.user.email, result.user.role);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful!',
        userId: result.user.id,
        redirectUrl: '/dashboard/member',
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error as Error, { context: 'signup' });
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
