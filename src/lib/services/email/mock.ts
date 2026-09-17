import { Resend } from 'resend';
import logger from '@/lib/logger';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId: string;
  message?: string;
}

const DEV_MODE = process.env.SEND_EMAILS !== 'true';
const FROM_EMAIL =
  process.env.EMAIL_FROM ||
  (process.env.NODE_ENV === 'production'
    ? 'GemFitness <onboarding@resend.dev>'
    : 'GemFitness <noreply@gemfitness.com>');

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (DEV_MODE) return null;
  if (!process.env.RESEND_API_KEY) {
    logger.error('RESEND_API_KEY is not set. Email cannot be sent.');
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Send transactional email via Resend (or log in DEV_MODE when SEND_EMAILS !== 'true')
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  const from = data.from || FROM_EMAIL;

  if (DEV_MODE) {
    const messageId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    logger.info('📧 [DEV MODE] Email would be sent', {
      to: data.to,
      subject: data.subject,
      messageId,
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('EMAIL: Development mode. Not sent through Resend.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`From: ${from}`);
    console.log(`Message ID: ${messageId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return {
      success: true,
      messageId,
      message: 'DEV: Email logged successfully',
    };
  }

  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      messageId: '',
      message: 'Email service not configured',
    };
  }

  try {
    const { data: result, error } = await client.emails.send({
      from,
      to: [data.to],
      subject: data.subject,
      html: data.html,
    });

    if (error) {
      logger.error('❌ Failed to send email:', error);
      return {
        success: false,
        messageId: '',
        message: error.message,
      };
    }

    const messageId = result?.id || `msg_${Date.now()}`;
    logger.info('✅ Email sent via Resend', {
      to: data.to,
      subject: data.subject,
      messageId,
    });

    return {
      success: true,
      messageId,
      message: 'Email sent successfully',
    };
  } catch (error) {
    logger.error('❌ Error sending email:', error);
    return {
      success: false,
      messageId: '',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email to new member
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  qrCode: string,
  additionalMessage?: string
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to GemFitness! 💪</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>Welcome to the GemFitness family! We're excited to have you on board.</p>
          
          <p>Your membership is now active. Here's your unique QR code:</p>
          <p><strong>QR Code:</strong> ${qrCode}</p>
          
          <p>You can use this QR code to check in at the gym. Show it at the reception desk or use our self-check-in kiosks.</p>
          
          ${additionalMessage ? `
          <div class="alert">
            <h3>⚠️ Important: Complete Your Health Screening</h3>
            <p>Based on your initial health screening, we recommend completing a comprehensive PAR-Q+ questionnaire before your first visit. This helps us ensure your safety and create the best training program for you.</p>
            <p>${additionalMessage}</p>
            <p><strong>Please complete this within 7 days of signup.</strong></p>
          </div>
          ` : ''}
          
          <h3>What's Next?</h3>
          <ul>
            <li>Visit our gym and check in with your QR code</li>
            <li>Explore all available equipment and classes</li>
            <li>Set your fitness goals in your dashboard</li>
            <li>Book your first class or personal training session</li>
            ${additionalMessage ? '<li><strong>Complete your comprehensive health screening (PAR-Q+)</strong></li>' : ''}
          </ul>
          
          <p>If you have any questions, feel free to reach out to our team.</p>
          
          <p>Let's achieve your fitness goals together!</p>
          
          <p><strong>The GemFitness Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 GemFitness. All rights reserved.</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to GemFitness - Your Membership is Active! 🎉',
    html,
    from: 'GemFitness <noreply@gemfitness.com>',
  });
}

/**
 * Send subscription expiry reminder
 */
export async function sendExpiryReminderEmail(
  email: string,
  firstName: string,
  daysLeft: number
): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Hi ${firstName},</h2>
        <p>Your GemFitness membership will expire in <strong>${daysLeft} days</strong>.</p>
        <p>Renew your membership to keep your gym access active.</p>
        <p>Visit your dashboard to renew or contact us for assistance.</p>
        <p><strong>The GemFitness Team</strong></p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your GemFitness Membership Expires in ${daysLeft} Days`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<EmailResponse> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for your GemFitness account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" style="color: #f97316;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p><strong>The GemFitness Team</strong></p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your GemFitness Password',
    html,
  });
}

/**
 * Send event booking confirmation with QR ticket
 */
export async function sendEventBookingConfirmation(
  email: string,
  firstName: string,
  eventDetails: {
    eventTitle: string;
    eventDate: string;
    location: string;
    ticketQRCode: string;
    isFree: boolean;
    price?: number;
  }
): Promise<EmailResponse> {
  const formattedDate = new Date(eventDetails.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .ticket-box { background: white; border: 2px dashed #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
        .qr-code { font-size: 18px; font-family: monospace; background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0; word-break: break-all; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎫 Event Registration Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>Your registration for <strong>${eventDetails.eventTitle}</strong> has been confirmed!</p>
          
          <div class="ticket-box">
            <h3>📅 Event Details</h3>
            <p><strong>${eventDetails.eventTitle}</strong></p>
            <p>📍 ${eventDetails.location}</p>
            <p>🕐 ${formattedDate}</p>
            ${!eventDetails.isFree ? `<p>💰 GH₵ ${eventDetails.price?.toFixed(2)}</p>` : '<p>✅ Free Event</p>'}
            
            <h4 style="margin-top: 30px;">Your Ticket QR Code:</h4>
            <div class="qr-code">${eventDetails.ticketQRCode}</div>
            <p style="color: #666; font-size: 14px;">Present this QR code at the event check-in</p>
          </div>
          
          <h3>What to Bring:</h3>
          <ul>
            <li>This email with your QR code (digital or printed)</li>
            <li>A valid ID</li>
            <li>Water bottle and towel</li>
            <li>Comfortable workout attire</li>
          </ul>
          
          <p><strong>Important:</strong> Arrive at least 15 minutes before the event starts for check-in.</p>
          
          <p>We're excited to see you there!</p>
          
          <p><strong>The GemFitness Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 GemFitness. All rights reserved.</p>
          <p>Need help? Contact us at support@gemfitness.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Event Confirmed: ${eventDetails.eventTitle} 🎫`,
    html,
    from: 'GemFitness Events <events@gemfitness.com>',
  });
}

/**
 * Send class booking confirmation
 */
export async function sendClassBookingConfirmation(
  email: string,
  firstName: string,
  classDetails: {
    className: string;
    instructor: string;
    schedule: string;
    bookedFor: string;
    isFree: boolean;
    price?: number;
  }
): Promise<EmailResponse> {
  const formattedDate = new Date(classDetails.bookedFor).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .class-box { background: white; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️ Class Booking Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName}!</h2>
          <p>You're all set for <strong>${classDetails.className}</strong>!</p>
          
          <div class="class-box">
            <h3>📋 Class Details</h3>
            <p><strong>Class:</strong> ${classDetails.className}</p>
            <p><strong>Instructor:</strong> ${classDetails.instructor}</p>
            <p><strong>Schedule:</strong> ${classDetails.schedule}</p>
            <p><strong>Date/Time:</strong> ${formattedDate}</p>
            ${!classDetails.isFree ? `<p><strong>Price:</strong> GH₵ ${classDetails.price?.toFixed(2)}</p>` : '<p><strong>Included in your membership</strong> ✅</p>'}
          </div>
          
          <h3>Before You Come:</h3>
          <ul>
            <li>Arrive 10 minutes early for equipment setup</li>
            <li>Bring water and a towel</li>
            <li>Wear comfortable workout clothes and proper footwear</li>
            <li>Check in at reception with your QR code</li>
          </ul>
          
          <p><strong>Cancellation Policy:</strong> Please cancel at least 12 hours before the class to avoid losing your booking credit.</p>
          
          <p>See you in class!</p>
          
          <p><strong>The GemFitness Team</strong></p>
        </div>
        <div class="footer">
          <p>© 2025 GemFitness. All rights reserved.</p>
          <p>Manage your bookings in your dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Class Confirmed: ${classDetails.className} on ${formattedDate}`,
    html,
    from: 'GemFitness Classes <classes@gemfitness.com>',
  });
}
