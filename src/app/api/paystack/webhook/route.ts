import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';
import { generateMemberQRCode } from '@/lib/qr/generator';
import { sendWelcomeEmail } from '@/lib/services/email/mock';
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

  // Case 1: User already exists (renewal or top-up)
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

  // Case 2: New registration - create user and subscription
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

    // Send welcome email asynchronously
    sendWelcomeEmail(
      result.user.email,
      result.user.firstName,
      result.qrCode
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
