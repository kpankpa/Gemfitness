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

    // Debug environment variables
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    logger.info('🔍 Environment check:', {
      secretKeyPresent: !!secretKey,
      secretKeyPrefix: secretKey?.substring(0, 8),
      publicKeyPresent: !!publicKey,
      publicKeyPrefix: publicKey?.substring(0, 8),
    });

    // Validation
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Generate unique reference with manual approach
    const manualRef = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
    const reference = manualRef;

    // Convert amount to kobo (Paystack requirement)
    const amountInKobo = paystackService.toKobo(amount);

    logger.info('🔄 Initializing payment:', {
      email,
      amount,
      reference,
      manualRef,
      plan,
      timestamp: Date.now()
    });

    // Call Paystack Initialize API with retry for duplicate references
    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const currentReference = attempts === 0 ? reference : paystackService.generateReference('GYM');
        
        response = await paystackService.initializePayment({
          email,
          amount: amountInKobo,
          reference: currentReference,
          currency: 'GHS', // Ghana Cedis
          metadata: {
            ...metadata,
            registration_type: 'new_signup',
            plan: plan || 'monthly',
          },
          callback_url: callback_url || `${process.env.NEXTAUTH_URL}/payment/callback`,
          channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
        });

        // If successful, break out of retry loop
        break;
      } catch (error: any) {
        attempts++;
        
        // If it's a duplicate reference error and we have attempts left, retry
        if (error.message?.includes('Duplicate Transaction Reference') && attempts < maxAttempts) {
          logger.warn(`⚠️ Duplicate reference detected, retrying (${attempts}/${maxAttempts}):`, {
            originalReference: reference,
            attempt: attempts
          });
          continue;
        }
        
        // If it's not a duplicate error or we're out of attempts, throw
        throw error;
      }
    }

    logger.info('🔍 Debug payment currency:', {
      explicitCurrency: 'GHS',
      amountInKobo,
      finalReference: (response?.data as { reference?: string })?.reference || reference,
    });

    logger.info('📡 Paystack API response:', {
      status: response?.status,
      message: response?.message,
      hasData: !!response?.data,
    });

    if (!response || !response.status) {
      logger.error('❌ Paystack initialization failed:', {
        status: response?.status,
        message: response?.message,
        fullResponse: response,
      });
      return NextResponse.json(
        { 
          status: false,
          error: 'Payment initialization failed', 
          message: response?.message || 'Unknown error from payment gateway',
          details: response
        },
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
      status: true,
      success: true,
      data: {
        access_code: responseData.access_code,
        authorization_url: responseData.authorization_url,
        reference,
      },
    });

  } catch (error) {
    logger.error('❌ Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
