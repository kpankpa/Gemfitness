import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/services/paystack';
import logger from '@/lib/logger';

/**
 * Initialize Payment API
 * Called from frontend to start payment process
 * 
 * POST /api/payment/initialize
 * Body: { email, amount, metadata, plan? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, metadata, plan, callback_url } = body;

    // Validation
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = paystackService.generateReference('GYM');

    // Convert amount to kobo (Paystack requirement)
    const amountInKobo = paystackService.toKobo(amount);

    logger.info('🔄 Initializing payment:', {
      email,
      amount,
      reference,
      plan,
    });

    // Call Paystack Initialize API
    const response = await paystackService.initializePayment({
      email,
      amount: amountInKobo,
      reference,
      metadata: {
        ...metadata,
        registration_type: 'new_signup',
        plan: plan || 'monthly',
      },
      callback_url: callback_url || `${process.env.NEXTAUTH_URL}/payment/callback`,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
    });

    if (!response.status) {
      logger.error('❌ Paystack initialization failed:', response);
      return NextResponse.json(
        { error: 'Payment initialization failed', message: response.message },
        { status: 500 }
      );
    }

    const responseData = response.data as { authorization_url: string; access_code: string; reference: string };

    logger.info('✅ Payment initialized:', {
      reference,
      authorization_url: responseData.authorization_url,
    });

    // Return access_code and reference to frontend
    return NextResponse.json({
      success: true,
      access_code: responseData.access_code,
      authorization_url: responseData.authorization_url,
      reference,
    });

  } catch (error) {
    logger.error('❌ Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
