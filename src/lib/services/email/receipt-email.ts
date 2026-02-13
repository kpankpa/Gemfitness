// Receipt Email Service
// src/lib/services/email/receipt-email.ts

import { sendEmail, EmailResponse } from '@/lib/services/email/mock';

export interface ReceiptEmailData {
  memberName: string;
  memberEmail: string;
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  plan: string;
  transactionDate: Date;
  receiptUrl: string;
}

/**
 * Send payment receipt email to member
 */
export async function sendReceiptEmail(data: ReceiptEmailData): Promise<EmailResponse> {
  const formattedDate = new Date(data.transactionDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatMethod = (method: string) => {
    if (method === 'momo') return 'MTN Mobile Money';
    if (method === 'paystack') return 'Card/Bank Transfer';
    return method.toUpperCase();
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - GemFitness</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7fa; }
        .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 18px; opacity: 0.95; }
        .content { padding: 40px 30px; }
        .success-badge { background: #28a745; color: white; padding: 10px 20px; border-radius: 25px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 25px; }
        .receipt-detail { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; }
        .receipt-detail:last-child { border-bottom: none; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: 600; color: #333; font-size: 14px; text-align: right; }
        .amount-highlight { display: flex; justify-content: space-between; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6B35; }
        .amount-highlight .label { font-size: 16px; color: #333; }
        .amount-highlight .value { font-size: 24px; color: #28a745; font-weight: bold; }
        .button { display: inline-block; background: #FF6B35; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #E55A2B; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 13px; }
        .footer-links { margin-top: 15px; }
        .footer-links a { color: #FF6B35; text-decoration: none; margin: 0 10px; }
        .divider { height: 1px; background: #e0e0e0; margin: 25px 0; }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; border-radius: 8px; }
          .content { padding: 25px 20px; }
          .header { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">💪 GEMFITNESS</div>
          <div class="subtitle">Payment Receipt</div>
        </div>
        
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">✓ PAYMENT SUCCESSFUL</span>
          </div>
          
          <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
            Dear <strong>${data.memberName}</strong>,
          </p>
          
          <p style="color: #666; margin-bottom: 30px;">
            Thank you for your payment! Your transaction was successful. Here are your payment details:
          </p>
          
          <div class="amount-highlight">
            <span class="label">Amount Paid</span>
            <span class="value">${data.currency} ${data.amount.toLocaleString()}</span>
          </div>
          
          <div style="margin: 25px 0;">
            <div class="receipt-detail">
              <span class="label">Transaction Reference</span>
              <span class="value" style="font-family: monospace; font-size: 12px;">${data.reference}</span>
            </div>
            <div class="receipt-detail">
              <span class="label">Membership Plan</span>
              <span class="value">${data.plan.replace(/_/g, ' ')}</span>
            </div>
            <div class="receipt-detail">
              <span class="label">Payment Method</span>
              <span class="value">${formatMethod(data.paymentMethod)}</span>
            </div>
            <div class="receipt-detail">
              <span class="label">Transaction Date</span>
              <span class="value">${formattedDate}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.receiptUrl}" class="button" style="color: white;">
              📄 View Full Receipt
            </a>
          </div>
          
          <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin-top: 25px;">
            <p style="margin: 0; color: #e65100; font-size: 14px;">
              <strong>💡 Pro Tip:</strong> Save this email for your records. You can also view and download all your receipts from your member dashboard.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">GemFitness Gym</p>
          <p style="margin: 5px 0;">Building Stronger Communities, One Rep at a Time</p>
          <div class="footer-links">
            <a href="https://gemfitness.com">Website</a>
            <a href="mailto:support@gemfitness.com">Support</a>
            <a href="https://gemfitness.com/contact">Contact</a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            This is an automated receipt. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: data.memberEmail,
    subject: `Payment Receipt - ${data.reference} | GemFitness`,
    html,
    from: 'GemFitness <receipts@gemfitness.com>',
  });
}
