/**
 * Subscription Upgrade/Downgrade Emails
 */

import { sendEmail } from '@/lib/services/email/mock';

export async function sendUpgradeConfirmationEmail({
  to,
  firstName,
  oldPlan,
  newPlan,
  proratedAmount,
  newEndDate,
  chargeReference
}: {
  to: string;
  firstName: string;
  oldPlan: string;
  newPlan: string;
  proratedAmount: number;
  newEndDate: Date;
  chargeReference?: string;
}): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(newEndDate).toLocaleDateString();

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
            .plan-comparison { display: flex; justify-content: space-around; margin: 20px 0; }
            .plan-box { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; flex: 1; margin: 0 10px; }
            .arrow { margin: 0 10px; align-self: center; font-size: 20px; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Upgrade Complete!</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Congratulations! Your plan has been successfully upgraded. You now have access to more benefits!</p>
                
                <div class="success-badge">✓ Upgrade Confirmed</div>
                
                <h3 style="margin-top: 20px;">Your Plan Change</h3>
                <div class="plan-comparison">
                    <div class="plan-box">
                        <strong>${oldPlan}</strong>
                    </div>
                    <div class="arrow">→</div>
                    <div class="plan-box">
                        <strong>${newPlan}</strong>
                    </div>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span><strong>Upgrade Charge:</strong></span>
                        <span>GH₵${Math.abs(proratedAmount).toFixed(2)}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>New Expiry Date:</strong></span>
                        <span>${formattedDate}</span>
                    </div>
                    ${chargeReference ? `<div class="detail-row">
                        <span><strong>Reference:</strong></span>
                        <span>${chargeReference}</span>
                    </div>` : ''}
                </div>
                
                <h3>What's Included in Your New Plan?</h3>
                <ul>
                    <li>✓ Full access to all classes</li>
                    <li>✓ Priority class booking</li>
                    <li>✓ 1-on-1 training sessions (if applicable)</li>
                    <li>✓ Nutrition planning assistance</li>
                </ul>
                
                <p style="margin-top: 20px;">Thank you for choosing GemFitness! Enjoy your enhanced experience.</p>
                
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
    subject: `🚀 Plan Upgrade Confirmed | GemFitness`,
    html: htmlContent
  });
}

export async function sendDowngradeConfirmationEmail({
  to,
  firstName,
  oldPlan,
  newPlan,
  creditAmount,
  newEndDate
}: {
  to: string;
  firstName: string;
  oldPlan: string;
  newPlan: string;
  creditAmount: number;
  newEndDate: Date;
}): Promise<{ success: boolean; error?: string }> {
  const formattedDate = new Date(newEndDate).toLocaleDateString();

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
            .confirm-badge { display: inline-block; background: #FF9800; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; }
            .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .plan-comparison { display: flex; justify-content: space-around; margin: 20px 0; }
            .plan-box { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; flex: 1; margin: 0 10px; }
            .credit-highlight { background: #FFF3CD; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Downgrade Confirmed</h1>
            </div>
            <div class="content">
                <p>Hi ${firstName},</p>
                
                <p>Your plan has been successfully downgraded. We appreciate you being part of the GemFitness community!</p>
                
                <div class="confirm-badge">✓ Change Confirmed</div>
                
                <h3 style="margin-top: 20px;">Your Plan Change</h3>
                <div class="plan-comparison">
                    <div class="plan-box">
                        <strong>${oldPlan}</strong>
                    </div>
                    <div style="margin: 0 10px; align-self: center; font-size: 20px;">→</div>
                    <div class="plan-box">
                        <strong>${newPlan}</strong>
                    </div>
                </div>
                
                <div class="credit-highlight">
                    <strong>💰 Credit Applied: GH₵${creditAmount.toFixed(2)}</strong>
                    <p>This credit has been applied to extend your membership access.</p>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span><strong>New Expiry Date:</strong></span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                
                <h3>What's Included in Your Plan?</h3>
                <ul>
                    <li>✓ Access to selected classes</li>
                    <li>✓ Member facilities access</li>
                    <li>✓ Monthly check-ins</li>
                </ul>
                
                <p style="margin-top: 20px;">Have feedback about your experience? We'd love to hear from you!</p>
                
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
    subject: `✓ Plan Downgrade Confirmed | GemFitness`,
    html: htmlContent
  });
}

export const sendUpgradeEmails = {
  sendUpgradeConfirmationEmail,
  sendDowngradeConfirmationEmail
};
