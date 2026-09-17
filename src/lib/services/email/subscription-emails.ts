/**
 * Subscription Status Change Emails
 * Pause, resume, and general subscription notifications
 */

import { sendEmail } from '@/lib/services/email/mock';

export async function sendPausedEmail({
  to,
  firstName,
  resumeDate,
  reason
}: {
  to: string;
  firstName: string;
  resumeDate: Date;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(resumeDate).toLocaleDateString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .pause-badge { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
            .info-box { background: #E3F2FD; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏸️ Subscription Paused</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Your GemFitness subscription has been paused. You won't be charged during this time, and your access will be temporarily suspended.</p>
                
                <div class="pause-badge">⏸️ Paused</div>
                
                <div class="details">
                    <p><strong>Pause Details:</strong></p>
                    <p>Your subscription will automatically resume on <strong>${formattedDate}</strong>.</p>
                    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                </div>
                
                <div class="info-box">
                    <h4>What Happens Next?</h4>
                    <ul>
                        <li>Your membership access is temporarily suspended</li>
                        <li>No charges will be applied during the pause</li>
                        <li>Your membership will automatically resume on ${formattedDate}</li>
                        <li>You can manually resume anytime before the resume date</li>
                    </ul>
                </div>
                
                <h3>Need to Resume Earlier?</h3>
                <p>You can resume your subscription anytime before ${formattedDate} by visiting your account settings.</p>
                
                <p style="margin-top: 20px;">We look forward to seeing you back soon!</p>
                
                <p>Best regards,<br>
                <strong>The GemFitness Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 GemFitness. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `⏸ Your Subscription Has Been Paused | GemFitness`,
    html: htmlContent
  });
}

export async function sendResumedEmail({
  to,
  firstName,
  endDate
}: {
  to: string;
  firstName: string;
  endDate: Date;
}): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(endDate).toLocaleDateString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .resume-badge { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .info-box { background: #F1F8E9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>▶️ Welcome Back!</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Your GemFitness subscription has resumed, and your gym access is active again.</p>
                
                <div class="resume-badge">✓ Active</div>
                
                <div class="details">
                    <p><strong>Subscription Status:</strong> ACTIVE</p>
                    <p><strong>Expiry Date:</strong> ${formattedDate}</p>
                </div>
                
                <div class="info-box">
                    <h4>You Can Now:</h4>
                    <ul>
                        <li>✓ Book classes</li>
                        <li>✓ Access all member facilities</li>
                        <li>✓ Check in at the gym</li>
                        <li>✓ Access member-only events</li>
                    </ul>
                </div>
                
                <h3>Let's Get Moving!</h3>
                <p>Browse our available classes and find your next workout session.</p>
                
                <center>
                    <a href="https://gemfitness.app/classes" class="cta-button">Browse Classes</a>
                </center>
                
                <p style="margin-top: 30px;">We look forward to seeing you at the gym.</p>
                
                <p>Best regards,<br>
                <strong>The GemFitness Team</strong></p>
            </div>
            <div class="footer">
                <p>&copy; 2026 GemFitness. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `▶️ Your Subscription Has Been Resumed | GemFitness`,
    html: htmlContent
  });
}

export const sendSubscriptionEmails = {
  sendPausedEmail,
  sendResumedEmail
};
