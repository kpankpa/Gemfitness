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

/**
 * Mock email sending using Resend
 * In production, this would call Resend API
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info('📧 MOCK EMAIL: Sending email', {
    to: data.to,
    subject: data.subject,
    messageId,
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 MOCK EMAIL SENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${data.to}`);
  console.log(`Subject: ${data.subject}`);
  console.log(`From: ${data.from || 'noreply@gemfitness.com'}`);
  console.log(`Message ID: ${messageId}`);
  console.log('\nEmail Content:');
  console.log(data.html);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return {
    success: true,
    messageId,
    message: 'MOCK: Email sent successfully',
  };
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
        <p>Don't miss out on your fitness journey! Renew your membership to continue enjoying all the benefits.</p>
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

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
