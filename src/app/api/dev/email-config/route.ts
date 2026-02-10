import { NextResponse } from 'next/server';

/**
 * DEV ONLY: Check email configuration status
 * 
 * This endpoint shows current email service configuration
 * Useful for debugging email issues
 * 
 * Usage: GET /api/dev/email-config
 */

export async function GET() {
  const DEV_MODE = process.env.SEND_EMAILS !== 'true';
  
  return NextResponse.json({
    devMode: DEV_MODE,
    config: {
      sendEmails: process.env.SEND_EMAILS || 'not set (defaults to dev mode)',
      fromEmail: process.env.EMAIL_FROM || 'not set',
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    status: DEV_MODE 
      ? '🔧 Development Mode - Emails logged to console only'
      : '✅ Production Mode - Emails sent via Resend',
    instructions: DEV_MODE
      ? 'Check your terminal console for OTP codes and email content'
      : 'Emails are being sent via Resend API',
  });
}
