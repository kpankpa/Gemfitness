/**
 * Email Service using Resend
 * Handles OTP verification emails and other transactional emails
 * 
 * DEVELOPMENT MODE:
 * - Set SEND_EMAILS=false in .env to use dev mode
 * - OTPs will be logged to console and stored in database
 * - Use /api/dev/get-otp endpoint to retrieve OTP for testing
 */

import { Resend } from 'resend';
import logger from '@/lib/logger';

// Development mode flag
const DEV_MODE = process.env.SEND_EMAILS !== 'true';
const TEST_MODE_WARNING = DEV_MODE ? '🔧 DEV MODE ENABLED - Emails will be logged to console only' : '✅ PRODUCTION MODE - Emails will be sent via Resend';

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 
  (process.env.NODE_ENV === 'production' 
    ? 'GemFitness <onboarding@resend.dev>'  // This should be changed to verified domain in production
    : 'GemFitness <kaylonprince@gmail.com>' // Use verified email for testing
  );
const APP_NAME = 'GemFitness';

// Enhanced logging for debugging
logger.info('📧 Email service configuration:', {
  hasResendApiKey: !!process.env.RESEND_API_KEY,
  apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
  fromEmail: FROM_EMAIL,
  appName: APP_NAME,
  devMode: DEV_MODE,
  modeStatus: TEST_MODE_WARNING,
});

// Initialize Resend with error handling (only if not in dev mode)
let resend: Resend;
try {
  if (!DEV_MODE) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
    logger.info('✅ Resend client initialized successfully');
  } else {
    logger.info('🔧 Running in DEV MODE - Resend client initialization skipped');
    resend = null as any; // Type assertion for dev mode
  }
} catch (error) {
  logger.error('❌ Failed to initialize Resend client:', error);
  throw error;
}

interface SendOTPEmailParams {
  to: string;
  firstName: string;
  otpCode: string;
}

interface SendWelcomeEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  plan: string;
  membershipId: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  devMode?: boolean;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail({ to, firstName, otpCode }: SendOTPEmailParams): Promise<EmailResult> {
  try {
    logger.info('📧 Attempting to send OTP email:', {
      to,
      firstName,
      otpCode,
      devMode: DEV_MODE,
      apiKeyPresent: !!process.env.RESEND_API_KEY,
      fromEmail: FROM_EMAIL,
    });

    // ✅ DEV MODE: Log to console instead of sending email
    if (DEV_MODE) {
      logger.info('🔧 [DEV MODE] OTP Email would be sent:', {
        to,
        firstName,
        otpCode,
        subject: `${otpCode} is your ${APP_NAME} verification code`,
        expiresIn: '15 minutes',
      });
      
      // Store in console for easy reference
      console.log('\n' + '='.repeat(60));
      console.log('🔐 OTP EMAIL (DEV MODE)');
      console.log('='.repeat(60));
      console.log(`To: ${to}`);
      console.log(`Name: ${firstName}`);
      console.log(`\n📝 OTP CODE: ${otpCode}`);
      console.log(`⏱️  Expires in: 15 minutes`);
      console.log('='.repeat(60) + '\n');
      
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        devMode: true,
      };
    }

    // ✅ PRODUCTION MODE: Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${otpCode} is your ${APP_NAME} verification code`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🏋️ ${APP_NAME}</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Complete Your GemFitness Registration</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px;">Hi ${firstName}! 👋</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to ${APP_NAME}! To complete your registration and verify your email address, please enter the following code:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fecaca; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div style="font-size: 42px; font-weight: bold; color: #ef4444; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otpCode}</div>
                <p style="margin: 15px 0 0; color: #9ca3af; font-size: 13px;">⏱️ This code expires in 15 minutes</p>
              </div>
              
              <p style="margin: 0 0 15px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                Enter this code on the verification page to activate your account.
              </p>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                  <strong>🔒 Security Tip:</strong> Never share this code with anyone. ${APP_NAME} will never ask for your verification code via phone or message.
                </p>
              </div>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Need help? Contact us at</p>
                    <p style="margin: 0 0 20px;">
                      <a href="mailto:support@gemfitness.com" style="color: #ef4444; text-decoration: none; font-weight: 600;">support@gemfitness.com</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                      Accra, Ghana
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `Hi ${firstName}!\n\nYour ${APP_NAME} verification code is: ${otpCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't create an account, please ignore this email.\n\n- The ${APP_NAME} Team`,
    });

    if (error) {
      logger.error('❌ Failed to send OTP email:', error);
      return { success: false, error: error.message };
    }

    logger.info('✅ OTP email sent successfully:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };

  } catch (error) {
    logger.error('❌ Error sending OTP email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendVerifiedWelcomeEmail({ to, firstName, lastName, plan, membershipId }: SendWelcomeEmailParams): Promise<EmailResult> {
  try {
    const planNames: Record<string, string> = {
      'ONE_MONTH': 'Monthly Membership',
      'THREE_MONTHS': 'Quarterly Membership',
      'SIX_MONTHS': 'Semi-Annual Membership',
      'TWELVE_MONTHS': 'Annual Membership',
      'DAILY': 'Day Pass',
    };

    // ✅ DEV MODE: Log to console instead of sending email
    if (DEV_MODE) {
      logger.info('🔧 [DEV MODE] Welcome email would be sent:', {
        to,
        firstName,
        lastName,
        plan,
        membershipId,
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 WELCOME EMAIL (DEV MODE)');
      console.log('='.repeat(60));
      console.log(`To: ${to}`);
      console.log(`Name: ${firstName} ${lastName}`);
      console.log(`Plan: ${planNames[plan] || plan}`);
      console.log(`Member ID: ${membershipId}`);
      console.log('='.repeat(60) + '\n');
      
      return {
        success: true,
        messageId: `dev-welcome-${Date.now()}`,
        devMode: true,
      };
    }

    // ✅ PRODUCTION MODE: Send via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Welcome to ${APP_NAME}, ${firstName}! 🎉`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to ${APP_NAME}!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your account is verified and ready!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 22px;">Hi ${firstName} ${lastName}! 💪</h2>
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Congratulations! Your email has been verified and your ${APP_NAME} membership is now active!
              </p>
              
              <!-- Membership Details -->
              <div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px;">📋 Your Membership Details</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Member ID:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${membershipId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${planNames[plan] || plan}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <h3 style="margin: 25px 0 15px; color: #1f2937; font-size: 18px;">🚀 What's Next?</h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563; font-size: 14px; line-height: 2;">
                <li>Download your QR code from the member dashboard</li>
                <li>Use it to check in at the gym</li>
                <li>Book classes and events online</li>
                <li>Track your fitness progress</li>
              </ul>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gemfitness.com'}/login" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard →</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                Accra, Ghana
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `Welcome to ${APP_NAME}, ${firstName} ${lastName}!\n\nYour email has been verified and your membership is now active!\n\nMember ID: ${membershipId}\nPlan: ${planNames[plan] || plan}\n\nLogin to your dashboard to get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://gemfitness.com'}/login\n\n- The ${APP_NAME} Team`,
    });

    if (error) {
      logger.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    logger.info('✅ Welcome email sent:', { to, messageId: data?.id });
    return { success: true, messageId: data?.id };

  } catch (error) {
    logger.error('❌ Error sending welcome email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if enough time has passed to resend OTP (rate limiting)
 */
export function canResendOTP(lastSent: Date | null): { canResend: boolean; waitSeconds: number } {
  if (!lastSent) return { canResend: true, waitSeconds: 0 };
  
  const COOLDOWN_SECONDS = 60; // 1 minute between resends
  const secondsSinceLast = Math.floor((Date.now() - lastSent.getTime()) / 1000);
  const waitSeconds = Math.max(0, COOLDOWN_SECONDS - secondsSinceLast);
  
  return {
    canResend: waitSeconds === 0,
    waitSeconds,
  };
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}

/**
 * Get OTP expiry time (15 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}
