import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';
import { generateMemberQRCode } from '@/lib/qr/generator';
import { sendWelcomeEmail, sendEventBookingConfirmation, sendClassBookingConfirmation } from '@/lib/services/email/mock';
import logger from '@/lib/logger';

/**
 * Paystack Webhook Handler
 * Receives and processes payment events from Paystack
 * 
 * IMPORTANT: Must return 200 OK immediately to acknowledge receipt
 * Long-running tasks should be handled after responding
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      logger.error('❌ Webhook: Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Validate webhook signature using HMAC SHA512
    const secretKey = process.env.PAYSTACK_SECRET_KEY!;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(body, 'utf8')
      .digest('hex');

    if (hash !== signature) {
      logger.error('❌ Webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse event
    const event = JSON.parse(body);
    logger.info('📥 Webhook received:', { event: event.event, reference: event.data.reference });

    // Acknowledge receipt immediately (Paystack requirement)
    const response = NextResponse.json({ status: 'success' }, { status: 200 });

    // Process event asynchronously (don't await - respond first!)
    processWebhookEvent(event).catch(error => {
      logger.error('❌ Webhook processing error:', error);
    });

    return response;

  } catch (error) {
    logger.error('❌ Webhook error:', error);
    // Still return 200 to prevent retries on parsing errors
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}

/**
 * Process webhook events asynchronously
 * This runs after responding to Paystack
 */
async function processWebhookEvent(event: Record<string, unknown>) {
  const { event: eventType, data } = event as { event: string; data: Record<string, unknown> };

  try {
    switch (eventType) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;

      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;

      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;

      case 'invoice.create':
        await handleInvoiceCreate(data);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data);
        break;

      case 'subscription.not_renew':
        await handleSubscriptionNotRenew(data);
        break;

      default:
        logger.info(`ℹ️ Unhandled webhook event: ${eventType}`);
    }
  } catch (error) {
    logger.error(`❌ Error processing ${eventType}:`, error);
    throw error;
  }
}

/**
 * Handle successful charge
 * This is the main event for one-time payments (registration)
 */
async function handleChargeSuccess(data: Record<string, unknown>) {
  const { reference, amount, customer, metadata, authorization } = data as {
    reference: string;
    amount: number;
    customer: { email: string };
    metadata?: Record<string, unknown>;
    authorization?: Record<string, unknown>;
    paid_at?: string;
  };

  logger.info('✅ Processing charge.success:', { reference, amount });

  // Find pending transaction in database
  const existingPayment = await prisma.payment.findFirst({
    where: { reference },
    include: { subscription: { include: { user: true } } },
  });

  if (existingPayment && existingPayment.status === 'SUCCESS') {
    logger.info('ℹ️ Payment already processed:', { reference });
    return; // Idempotency - already processed
  }

  // Extract metadata
  const user_id = (metadata as Record<string, unknown>)?.user_id as string | undefined;
  const registration_type = (metadata as Record<string, unknown>)?.registration_type as string | undefined;
  const channel = (metadata as Record<string, unknown>)?.channel as string | undefined;

  // Case 1: Walk-in MoMo registration - complete from pending
  if (channel === 'walk_in_registration') {
    await handleWalkInRegistrationPayment(reference);
    return;
  }

  // Case 2: Event booking payment
  if ((metadata as Record<string, unknown>)?.type === 'event_booking') {
    await handleEventBookingPayment(reference);
    return;
  }

  // Case 3: Class booking payment
  if ((metadata as Record<string, unknown>)?.type === 'class_booking') {
    await handleClassBookingPayment(reference);
    return;
  }

  // Case 4: User already exists (renewal or top-up)
  if (user_id && existingPayment) {
    const paidAtValue = (data as Record<string, unknown>).paid_at;
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: 'SUCCESS',
        paymentDate: new Date((typeof paidAtValue === 'string' ? paidAtValue : new Date().toISOString())),
      },
    });
    logger.info('✅ Payment updated for existing user:', { user_id, reference });
    return;
  }

  // Case 3: New online registration - create user and subscription
  if (!user_id && registration_type === 'new_signup') {
    await createNewUserFromPayment({
      reference,
      amount: amount / 100, // Convert from kobo to cedis
      customer,
      metadata,
      authorization,
      paid_at: data.paid_at,
    });
  }
}

/**
 * Create new user account from successful payment
 */
async function createNewUserFromPayment(paymentData: Record<string, unknown>) {
  const { reference, amount, customer, metadata, paid_at } = paymentData as {
    reference: string;
    amount: number;
    customer: { email: string };
    metadata: Record<string, string>;
    paid_at: string;
  };

  try {
    // Map plan to database enum
    const planMap: Record<string, 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR'> = {
      monthly: 'ONE_MONTH',
      quarterly: 'THREE_MONTHS',
      annual: 'ONE_YEAR',
    };

    const dbPlan = planMap[metadata.plan] || 'ONE_MONTH';

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    let planAmount = 0;

    switch (dbPlan) {
      case 'ONE_MONTH':
        endDate.setMonth(endDate.getMonth() + 1);
        planAmount = 200;
        break;
      case 'THREE_MONTHS':
        endDate.setMonth(endDate.getMonth() + 3);
        planAmount = 500;
        break;
      case 'ONE_YEAR':
        endDate.setFullYear(endDate.getFullYear() + 1);
        planAmount = 2200;
        break;
    }

    // Hash password (from metadata if provided, or generate random)
    const hashedPassword = metadata.password 
      ? await hashPassword(metadata.password)
      : await hashPassword(Math.random().toString(36).slice(-8));

    // Create user and subscription in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: metadata.email || customer.email,
          password: hashedPassword,
          firstName: metadata.first_name,
          lastName: metadata.last_name,
          phone: metadata.phone,
          address: metadata.address || null,
          emergencyContact: metadata.emergency_contact,
          emergencyPhone: metadata.emergency_phone,
          fitnessGoals: metadata.fitness_goals || null,
          medicalConditions: metadata.medical_conditions || null,
          dateOfBirth: new Date(metadata.date_of_birth),
          role: 'MEMBER',
          qrCode: '',
        },
      });

      // Generate QR code
      const qrCodeResult = await generateMemberQRCode();
      await tx.user.update({
        where: { id: user.id },
        data: { qrCode: qrCodeResult.token },
      });

      // Create subscription
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          plan: dbPlan,
          startDate,
          endDate,
          status: 'ACTIVE',
          amount: planAmount,
          registrationType: 'SELF',
        },
      });

      // Record payment
      await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          paymentDate: new Date(paid_at),
          paymentMethod: 'CARD',
          reference,
          status: 'SUCCESS',
        },
      });

      return { user, subscription, qrCode: `GYM|${qrCodeResult.token}` };
    });

    logger.info('✅ User created from webhook:', {
      userId: result.user.id,
      email: result.user.email,
      reference,
    });

    // Extract PAR-Q data from metadata if provided
    const parqBasic = (metadata as Record<string, unknown>).parq_basic;
    const needsParQFollowUp = parqBasic && (parqBasic as Record<string, unknown>).needsFollowUp === true;

    // Send welcome email with PAR-Q link if needed
    const emailMessage = needsParQFollowUp 
      ? `Complete your comprehensive health screening at: ${process.env.NEXT_PUBLIC_BASE_URL}/member/par-q`
      : '';

    sendWelcomeEmail(
      result.user.email,
      result.user.firstName,
      result.qrCode,
      needsParQFollowUp ? emailMessage : undefined
    ).catch(error => logger.error('❌ Welcome email failed:', error));

  } catch (error) {
    logger.error('❌ Failed to create user from payment:', error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreate(data: Record<string, unknown>) {
  const typedData = data as {
    subscription_code: string;
    customer: { email: string };
    plan: { name: string };
  };

  logger.info('📋 Subscription created:', {
    subscription_code: typedData.subscription_code,
    customer_email: typedData.customer.email,
    plan: typedData.plan.name,
  });

  // Update subscription record if exists
  // Or create audit log entry
}

/**
 * Handle subscription disable (cancelled or completed)
 */
async function handleSubscriptionDisable(data: Record<string, unknown>) {
  const typedData = data as {
    subscription_code: string;
    status: string;
  };

  logger.info('🔴 Subscription disabled:', {
    subscription_code: typedData.subscription_code,
    status: typedData.status,
  });

  // Update user subscription status to EXPIRED or CANCELLED
  // Send notification email
}

/**
 * Handle invoice creation (3 days before next payment)
 */
async function handleInvoiceCreate(data: Record<string, unknown>) {
  const typedData = data as {
    invoice_code: string;
    amount: number;
    customer: { email: string };
  };

  logger.info('📄 Invoice created:', {
    invoice_code: typedData.invoice_code,
    amount: typedData.amount / 100,
    customer: typedData.customer.email,
  });

  // Send payment reminder email
  // Notify admin of upcoming renewals
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(data: Record<string, unknown>) {
  const typedData = data as {
    invoice_code: string;
    customer: { email: string };
    description?: string;
  };

  logger.error('💳 Invoice payment failed:', {
    invoice_code: typedData.invoice_code,
    customer: typedData.customer.email,
    reason: typedData.description,
  });

  // Update subscription status to ATTENTION
  // Send payment failure notification
  // Provide link to update payment method
}

/**
 * Handle subscription not renewing
 */
async function handleSubscriptionNotRenew(data: Record<string, unknown>) {
  logger.info('⚠️ Subscription not renewing:', {
    subscription_code: data.subscription_code,
  });

  // Mark subscription for cancellation
  // Send confirmation email
}

/**
 * Handle walk-in MoMo registration payment
 * Complete user creation from pending registration
 */
async function handleWalkInRegistrationPayment(reference: string) {
  logger.info('🏃 Processing walk-in MoMo payment:', { reference });

  try {
    // Find pending registration
    const pendingReg = await prisma.pendingRegistration.findUnique({
      where: { paymentReference: reference }
    });

    if (!pendingReg) {
      logger.error('❌ Pending registration not found:', { reference });
      return;
    }

    if (pendingReg.paymentStatus === 'success') {
      logger.info('ℹ️ Walk-in registration already completed:', { reference });
      return; // Idempotency
    }

    // Update pending status
    await prisma.pendingRegistration.update({
      where: { id: pendingReg.id },
      data: { paymentStatus: 'success' }
    });

    // Create user from pending registration
    const user = await prisma.user.create({
      data: {
        firstName: pendingReg.firstName,
        lastName: pendingReg.lastName,
        email: pendingReg.email,
        phone: pendingReg.phone,
        password: pendingReg.password, // Already hashed
        role: 'MEMBER',
        qrCode: '',
        registrationType: 'WALK_IN',
        registrationPaid: true,
        emergencyContact: pendingReg.emergencyContact,
        emergencyPhone: pendingReg.emergencyPhone,
        dateOfBirth: pendingReg.dateOfBirth,
        address: pendingReg.address || '',
        fitnessGoals: pendingReg.fitnessGoals || '',
        medicalConditions: pendingReg.medicalConditions || '',
      }
    });

    // Generate QR code
    const qrCodeResult = await generateMemberQRCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrCodeResult.token }
    });

    // Create PAR-Q response
    const yesCount = [
      pendingReg.hasHeartCondition,
      pendingReg.hasChestPain,
      pendingReg.hasDizziness,
      pendingReg.hasJointProblems,
      pendingReg.takesMedication,
      pendingReg.hasOtherConditions
    ].filter(Boolean).length;
    
    const riskLevel = yesCount === 0 ? 'LOW' : yesCount <= 2 ? 'MEDIUM' : 'HIGH';

    await prisma.parQResponse.create({
      data: {
        userId: user.id,
        responses: JSON.stringify({
          hasHeartCondition: pendingReg.hasHeartCondition,
          hasChestPain: pendingReg.hasChestPain,
          hasDizziness: pendingReg.hasDizziness,
          hasJointProblems: pendingReg.hasJointProblems,
          takesMedication: pendingReg.takesMedication,
          hasOtherConditions: pendingReg.hasOtherConditions,
        }),
        otherReasonDetails: pendingReg.otherConditionsDetails || '',
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
      'ONE_MONTH': 200,
      'THREE_MONTHS': 500,
      'ONE_YEAR': 2200
    };

    const planDurations: Record<string, number> = {
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'ONE_YEAR': 365
    };

    const amount = planPrices[pendingReg.plan];
    const duration = planDurations[pendingReg.plan];

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: pendingReg.plan as 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR',
        amount,
        startDate,
        endDate,
        status: 'ACTIVE',
        registrationType: 'WALK_IN'
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: pendingReg.amountPaid,
        paymentMethod: 'MOMO',
        paymentDate: new Date(),
        reference: pendingReg.paymentReference,
        status: 'SUCCESS'
      }
    });

    // Delete pending registration
    await prisma.pendingRegistration.delete({
      where: { id: pendingReg.id }
    });

    logger.info('✅ Walk-in registration completed:', {
      userId: user.id,
      email: user.email,
      reference,
    });

  } catch (error) {
    logger.error('❌ Failed to complete walk-in registration:', error);
    throw error;
  }
}

/**
 * Handle event booking payment
 * Complete event registration from pending booking
 */
async function handleEventBookingPayment(reference: string) {
  logger.info('🎫 Processing event booking payment:', { reference });

  try {
    // Find pending event booking
    const pendingBooking = await prisma.pendingEventBooking.findUnique({
      where: { paymentReference: reference }
    });

    if (!pendingBooking) {
      logger.error('❌ Pending event booking not found:', { reference });
      return;
    }

    // Check if already processed
    const existingBooking = await prisma.eventBooking.findFirst({
      where: {
        userId: pendingBooking.userId,
        eventId: pendingBooking.eventId,
        paymentRef: reference
      }
    });

    if (existingBooking) {
      logger.info('ℹ️ Event booking already completed:', { reference });
      await prisma.pendingEventBooking.delete({
        where: { id: pendingBooking.id }
      });
      return; // Idempotency
    }

    // Generate QR ticket
    const ticketQRCode = `EVENT-${pendingBooking.eventId}-USER-${pendingBooking.userId}-${Date.now()}`;

    // Create confirmed event booking
    const booking = await prisma.eventBooking.create({
      data: {
        userId: pendingBooking.userId,
        eventId: pendingBooking.eventId,
        status: 'confirmed',
        paymentStatus: 'COMPLETED',
        paymentRef: reference,
        ticketQRData: ticketQRCode,
        ticketGeneratedAt: new Date()
      }
    });

    // Delete pending booking
    await prisma.pendingEventBooking.delete({
      where: { id: pendingBooking.id }
    });

    logger.info('✅ Event booking completed:', {
      bookingId: booking.id,
      userId: pendingBooking.userId,
      eventId: pendingBooking.eventId,
      reference
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({
      where: { id: pendingBooking.userId },
      select: { email: true, firstName: true }
    });

    const event = await prisma.event.findUnique({
      where: { id: pendingBooking.eventId },
      select: { title: true, eventDate: true, location: true, isFree: true, price: true }
    });

    if (user && event) {
      await sendEventBookingConfirmation(user.email, user.firstName, {
        eventTitle: event.title,
        eventDate: event.eventDate.toISOString(),
        location: event.location || 'GemFitness Tema',
        ticketQRCode: ticketQRCode,
        isFree: event.isFree,
        price: event.price || undefined
      });
    }

  } catch (error) {
    logger.error('❌ Failed to complete event booking:', error);
    throw error;
  }
}

/**
 * Handle class booking payment
 * Complete class enrollment from pending booking
 */
async function handleClassBookingPayment(reference: string) {
  logger.info('🏋️ Processing class booking payment:', { reference });

  try {
    // Find pending class booking
    const pendingBooking = await prisma.pendingClassBooking.findUnique({
      where: { paymentReference: reference }
    });

    if (!pendingBooking) {
      logger.error('❌ Pending class booking not found:', { reference });
      return;
    }

    // Check if already processed
    const existingBooking = await prisma.classBooking.findFirst({
      where: {
        userId: pendingBooking.userId,
        classId: pendingBooking.classId,
        paymentRef: reference
      }
    });

    if (existingBooking) {
      logger.info('ℹ️ Class booking already completed:', { reference });
      await prisma.pendingClassBooking.delete({
        where: { id: pendingBooking.id }
      });
      return; // Idempotency
    }

    // Create confirmed class booking
    const booking = await prisma.classBooking.create({
      data: {
        userId: pendingBooking.userId,
        classId: pendingBooking.classId,
        bookedFor: pendingBooking.bookedFor,
        status: 'confirmed',
        paymentStatus: 'COMPLETED',
        paymentRef: reference,
        amountPaid: pendingBooking.amount
      }
    });

    // Update class current bookings count
    await prisma.class.update({
      where: { id: pendingBooking.classId },
      data: {
        currentBookings: {
          increment: 1
        }
      }
    });

    // Delete pending booking
    await prisma.pendingClassBooking.delete({
      where: { id: pendingBooking.id }
    });

    logger.info('✅ Class booking completed:', {
      bookingId: booking.id,
      userId: pendingBooking.userId,
      classId: pendingBooking.classId,
      reference
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({
      where: { id: pendingBooking.userId },
      select: { email: true, firstName: true }
    });

    const classData = await prisma.class.findUnique({
      where: { id: pendingBooking.classId },
      select: { name: true, instructor: true, schedule: true, isFree: true, price: true }
    });

    if (user && classData) {
      await sendClassBookingConfirmation(user.email, user.firstName, {
        className: classData.name,
        instructor: classData.instructor,
        schedule: classData.schedule,
        bookedFor: pendingBooking.bookedFor.toISOString(),
        isFree: classData.isFree,
        price: classData.price || undefined
      });
    }

  } catch (error) {
    logger.error('❌ Failed to complete class booking:', error);
    throw error;
  }
}
