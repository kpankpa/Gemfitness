import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/services/paystack';
import logger from '@/lib/logger';

/**
 * Verify Payment API
 * Called from frontend after payment to confirm status
 * 
 * GET /api/payment/verify?reference=GYM-xxxxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    logger.info('🔍 Verifying payment:', { reference });

    // Call Paystack Verify API
    const response = await paystackService.verifyPayment(reference);

    if (!response.status) {
      logger.error('❌ Verification failed:', response);
      return NextResponse.json(
        { error: 'Verification failed', message: response.message },
        { status: 400 }
      );
    }

    const transactionData = response.data as {
      reference: string;
      status: string;
      amount: number;
      paid_at?: string;
      customer: { email: string };
      channel?: string;
      currency?: string;
      metadata?: Record<string, unknown>;
      authorization?: { authorization_code: string };
    };

    logger.info('✅ Payment verified:', {
      reference,
      status: transactionData.status,
      amount: transactionData.amount / 100,
    });

    // CRITICAL: Check both status AND amount
    const isSuccess = transactionData.status === 'success';
    const amountInCedis = transactionData.amount / 100;

    // Return verification result
    return NextResponse.json({
      success: isSuccess,
      reference: transactionData.reference,
      amount: amountInCedis,
      status: transactionData.status,
      paid_at: transactionData.paid_at,
      customer: {
        email: transactionData.customer.email,
      },
      channel: transactionData.channel,
      currency: transactionData.currency,
      metadata: transactionData.metadata,
      // Include authorization code for future recurring payments
      authorization_code: transactionData.authorization?.authorization_code,
    });

  } catch (error) {
    logger.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
