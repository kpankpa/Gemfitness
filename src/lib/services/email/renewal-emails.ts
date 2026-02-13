/**
 * Subscription Renewal Emails
 * Email templates for subscription renewal notifications and confirmations
 */

import { sendEmail } from '@/lib/services/email/mock';

interface RenewalEmailParams {
  to: string;
  firstName: string;
}

interface RenewalSuccessEmailParams extends RenewalEmailParams {
  newEndDate: Date;
  amount: number;
  renewalCount?: number;
}

interface RenewalFailedEmailParams extends RenewalEmailParams {
  reason: string;
  renewalAmount: number;
}

interface PaymentMethodRequiredParams extends RenewalEmailParams {
  renewalDueDate: Date;
}

/**
 * Send renewal success confirmation
 */
export async function sendRenewalSuccessEmail({
  to,
  firstName,
  newEndDate,
  amount,
  renewalCount = 1
}: RenewalSuccessEmailParams): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(newEndDate).toLocaleDateString();
  const renewalLabel = renewalCount > 1 ? ` (Renewal #${renewalCount})` : '';

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
            .success-badge { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💚 Renewal Successful!</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Great news! Your GemFitness subscription has been successfully renewed. You're all set to continue your fitness journey! 🏋️</p>
                
                <div class="success-badge">✓ Payment Confirmed</div>
                
                <div class="details">
                    <div class="detail-row">
                        <span><strong>Amount Charged:</strong></span>
                        <span>GH₵${amount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>New Expiry Date:</strong></span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Status:</strong></span>
                        <span style="color: #4CAF50; font-weight: bold;">Active</span>
                    </div>
                </div>
                
                <h3>What's Next?</h3>
                <ul>
                    <li>Your membership is now active and ready to use</li>
                    <li>You can book classes and access all member features</li>
                    <li>We'll send you a reminder 3 days before your next renewal</li>
                </ul>
                
                <a href="https://gemfitness.app/dashboard" class="cta-button">Go to Your Dashboard</a>
                
                <p>If you have any questions about your renewal or membership, please don't hesitate to contact us.</p>
                
                <p>Happy training!<br>
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
    subject: `✓ Subscription Renewed${renewalLabel} | GemFitness Membership Renewed`,
    html: htmlContent
  });
}

/**
 * Send renewal failed notification with retry info
 */
export async function sendRenewalFailedEmail({
  to,
  firstName,
  reason,
  renewalAmount
}: RenewalFailedEmailParams): Promise<{ success: boolean; error?: string }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .warning-box { background: #FFF3CD; border-left: 4px solid #FF9800; padding: 15px; margin: 15px 0; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .cta-button { display: inline-block; background: #FF9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Renewal Payment Failed</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <div class="warning-box">
                    <strong>⚠️ Your subscription renewal couldn't be processed</strong>
                    <p>${reason}</p>
                </div>
                
                <h3>What Happened?</h3>
                <p>We attempted to charge your stored payment method GH₵${renewalAmount.toFixed(2)} for your subscription renewal, but the payment failed.</p>
                
                <div class="details">
                    <div class="detail-row">
                        <span><strong>Renewal Amount:</strong></span>
                        <span>GH₵${renewalAmount.toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Status:</strong></span>
                        <span style="color: #FF9800;">Failed - Will Retry</span>
                    </div>
                </div>
                
                <h3>What Next?</h3>
                <p>Don't worry! We'll automatically retry your payment within the next 24 hours. Here's what you can do:</p>
                <ul>
                    <li><strong>Update Payment Method:</strong> Add or update your payment details to ensure the next attempt succeeds</li>
                    <li><strong>Contact Support:</strong> Reach out to us if you have questions about the failure</li>
                    <li><strong>Manual Renewal:</strong> You can manually renew your subscription right now if you prefer</li>
                </ul>
                
                <center>
                    <a href="https://gemfitness.app/account/billing" class="cta-button">Update Payment Method</a>
                </center>
                
                <p style="margin-top: 30px;">If your account access is affected, our support team is here to help!</p>
                
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
    subject: `⚠️ Renewal Payment Failed - Action Required | GemFitness`,
    html: htmlContent
  });
}

/**
 * Send reminder to add/update payment method
 */
export async function sendPaymentMethodRequiredEmail({
  to,
  firstName,
  renewalDueDate
}: PaymentMethodRequiredParams): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(renewalDueDate).toLocaleDateString();

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
            .info-box { background: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; }
            .cta-button { display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Update Your Payment Method</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Your GemFitness subscription will expire on <strong>${formattedDate}</strong>. To ensure automatic renewal, please add or update your payment method.</p>
                
                <div class="info-box">
                    <strong>🛡️ Secure & Easy</strong>
                    <p>We use industry-leading payment encryption to keep your information safe. Your payment method is only used for renewals.</p>
                </div>
                
                <h3>Why Update Now?</h3>
                <ul>
                    <li>Automatic renewal when your subscription expires</li>
                    <li>No interruption to your membership</li>
                    <li>No action needed on renewal date</li>
                </ul>
                
                <center>
                    <a href="https://gemfitness.app/account/billing/add-payment" class="cta-button">Add Payment Method</a>
                </center>
                
                <p style="margin-top: 30px; color: #666;">If you continue without adding a payment method, you'll need to manually renew your subscription on the expiration date.</p>
                
                <p>Questions? Contact our support team anytime.</p>
                
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
    subject: `💳 Add Payment Method for Automatic Renewal | GemFitness`,
    html: htmlContent
  });
}

/**
 * Send 3-day renewal reminder (improved version)
 */
export async function sendRenewalReminderEmail({
  to,
  firstName,
  daysUntilExpiry,
  amount
}: RenewalEmailParams & { daysUntilExpiry: number; amount: number }): Promise<{
  success: boolean;
  error?: string;
}> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667EEA; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .countdown { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
            .countdown-big { font-size: 48px; font-weight: bold; color: #667EEA; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667EEA; }
            .cta-button { display: inline-block; background: #667EEA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Your Membership Expires In ${daysUntilExpiry} Days</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Your GemFitness membership is about to expire! Don't lose access to your favorite classes and facilities.</p>
                
                <div class="countdown">
                    <div class="countdown-big">${daysUntilExpiry}</div>
                    <p>days until expiry</p>
                </div>
                
                <div class="details">
                    <p><strong>Quick Renewal Details:</strong></p>
                    <p>Amount: GH₵${amount.toFixed(2)}</p>
                    <p>Your membership will be renewed automatically if you have a payment method saved.</p>
                </div>
                
                <h3>Don't Lose Access!</h3>
                <p>Renew now to stay active and maintain your fitness momentum. It only takes seconds!</p>
                
                <center>
                    <a href="https://gemfitness.app/renew" class="cta-button">Renew Now</a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">If you would like to cancel your membership, you can do so anytime in your account settings.</p>
                
                <p>See you soon!<br>
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
    subject: `⏰ Your Membership Expires in ${daysUntilExpiry} Days | Renew Now`,
    html: htmlContent
  });
}

export const sendRenewalEmails = {
  sendRenewalSuccessEmail,
  sendRenewalFailedEmail,
  sendPaymentMethodRequiredEmail,
  sendRenewalReminderEmail
};
