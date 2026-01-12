import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/services/email/resend';
import { logger } from '@/lib/logger';

// Test endpoint to verify email service is working
export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    logger.info('🧪 Testing email service:', { email, firstName: firstName || 'Test User', testOTP });

    // Send test OTP email
    const result = await sendOTPEmail({
      to: email,
      firstName: firstName || 'Test User',
      otpCode: testOTP
    });

    logger.info('🧪 Email test result:', result);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully!' : `Failed to send email: ${result.error}`,
      testOTP: result.success ? testOTP : undefined,
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('🧪 Email test error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to test email service',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}