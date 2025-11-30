import logger, { logPayment } from '@/lib/logger';

export interface PaymentData {
  email: string;
  amount: number;
  reference: string;
  plan: string;
  userId: string;
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  authorizationUrl?: string;
  message?: string;
}

export interface PaymentVerification {
  success: boolean;
  amount: number;
  reference: string;
  paidAt: Date;
}

/**
 * Mock Paystack payment initialization
 * In production, this would call Paystack API
 */
export async function initializePayment(data: PaymentData): Promise<PaymentResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const reference = data.reference || `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info('🔶 MOCK PAYMENT: Initializing payment', {
    email: data.email,
    amount: data.amount,
    reference,
    plan: data.plan,
  });

  logPayment('INITIALIZE', data.userId, data.amount, {
    reference,
    plan: data.plan,
  });

  // Mock success response
  return {
    success: true,
    reference,
    authorizationUrl: `https://checkout.paystack.com/mock/${reference}`,
    message: 'MOCK: Payment initialized successfully',
  };
}

/**
 * Mock Paystack payment verification
 * In production, this would verify with Paystack API
 */
export async function verifyPayment(reference: string): Promise<PaymentVerification> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  logger.info('✅ MOCK PAYMENT: Verifying payment', { reference });

  // Mock successful verification
  // In a real scenario, you would check actual payment status
  return {
    success: true,
    amount: 0, // Amount would come from Paystack
    reference,
    paidAt: new Date(),
  };
}

/**
 * Mock payment webhook handler
 * In production, this would validate Paystack webhook signature
 */
export async function handlePaymentWebhook(payload: Record<string, unknown>): Promise<boolean> {
  logger.info('📥 MOCK PAYMENT: Webhook received', payload);

  // Mock webhook validation
  return true;
}

/**
 * Get payment plans with amounts
 */
export function getPaymentPlans() {
  return {
    monthly: {
      name: 'Monthly',
      amount: 200,
      registrationFee: 250,
      total: 450,
    },
    quarterly: {
      name: 'Quarterly',
      amount: 500,
      registrationFee: 250,
      total: 750,
    },
    annual: {
      name: 'Annual',
      amount: 2200,
      registrationFee: 250,
      total: 2450,
    },
  };
}

/**
 * Calculate total amount for a plan
 */
export function calculateTotalAmount(plan: 'monthly' | 'quarterly' | 'annual'): number {
  const plans = getPaymentPlans();
  return plans[plan].total;
}
