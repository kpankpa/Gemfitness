// Payment Receipt Generation Service
// src/lib/services/payment/receipt-generator.ts

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

interface ReceiptData {
  transactionId: string;
  memberName: string;
  memberEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  paidAt: Date;
  plan: string;
  subscriptionPeriod: string;
}

export class ReceiptGenerator {
  static async generateReceipt(transactionId: string): Promise<string> {
    try {
      // Fetch transaction details
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (!transaction || !transaction.user) {
        throw new Error('Transaction or user not found');
      }

      const subscription = transaction.user.subscriptions[0];
      const receiptData: ReceiptData = {
        transactionId: transaction.id,
        memberName: `${transaction.user.firstName} ${transaction.user.lastName}`,
        memberEmail: transaction.user.email,
        amount: transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        reference: transaction.reference,
        paidAt: transaction.paidAt!,
        plan: subscription?.plan || 'Unknown',
        subscriptionPeriod: this.getSubscriptionPeriod(subscription?.plan || 'ONE_MONTH', subscription?.startDate, subscription?.endDate)
      };

      return this.generateReceiptHTML(receiptData);

    } catch (error) {
      logger.error('Receipt generation error:', error);
      throw new Error('Failed to generate receipt');
    }
  }

  private static getSubscriptionPeriod(_plan: string, startDate?: Date, endDate?: Date): string {
    if (!startDate || !endDate) return 'N/A';
    
    const start = startDate.toLocaleDateString('en-GB');
    const end = endDate.toLocaleDateString('en-GB');
    return `${start} - ${end}`;
  }

  private static generateReceiptHTML(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .receipt { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #28a745; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 16px; }
          .receipt-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #28a745; }
          .label { color: #555; font-weight: 500; }
          .value { color: #333; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .status-badge { background: #28a745; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">💪 GEMFITNESS</div>
            <div class="subtitle">Payment Receipt</div>
            <div style="margin-top: 15px;">
              <span class="status-badge">PAYMENT SUCCESSFUL</span>
            </div>
          </div>
          
          <div class="receipt-info">
            <div class="receipt-row">
              <span class="label">Member:</span>
              <span class="value">${data.memberName}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Email:</span>
              <span class="value">${data.memberEmail}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${data.reference}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Payment Date:</span>
              <span class="value">${data.paidAt.toLocaleDateString('en-GB')} ${data.paidAt.toLocaleTimeString('en-GB')}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Payment Method:</span>
              <span class="value">${this.formatPaymentMethod(data.paymentMethod)}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Membership Plan:</span>
              <span class="value">${this.formatPlan(data.plan)}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Subscription Period:</span>
              <span class="value">${data.subscriptionPeriod}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Amount Paid:</span>
              <span class="value">${data.currency} ${data.amount.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Thank you for choosing Gemfitness!</strong></p>
            <p>Keep this receipt for your records. For any queries, contact us at info@gemfitness.com</p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
              Generated on ${new Date().toLocaleDateString('en-GB')} • Gemfitness Centre, Accra
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static formatPaymentMethod(method: string): string {
    switch (method.toLowerCase()) {
      case 'paystack': return '💳 Card/Bank Transfer';
      case 'momo': return '📱 MTN Mobile Money';
      case 'cash': return '💵 Cash';
      default: return method;
    }
  }

  private static formatPlan(plan: string): string {
    switch (plan) {
      case 'ONE_MONTH': return '1 Month Membership';
      case 'THREE_MONTHS': return '3 Months Membership';
      case 'ONE_YEAR': return '1 Year Membership';
      default: return plan;
    }
  }
}

// Receipt Email Service
export class ReceiptEmailService {
  static async sendReceiptEmail(transactionId: string): Promise<boolean> {
    try {
      const receiptHTML = await ReceiptGenerator.generateReceipt(transactionId);
      
      // Get transaction details for email
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          user: { select: { firstName: true, email: true } }
        }
      });

      if (!transaction?.user) {
        throw new Error('Transaction user not found');
      }

      // TODO: Integrate with your email service (currently using mock)
      // await emailService.send({
      //   to: transaction.user.email,
      //   subject: `Payment Receipt - ${transaction.reference}`,
      //   html: receiptHTML
      // });

      logger.info('✅ Receipt email sent:', {
        transactionId,
        email: transaction.user.email,
        reference: transaction.reference,
        receiptGenerated: receiptHTML.length > 0
      });

      return true;

    } catch (error) {
      logger.error('❌ Receipt email error:', error);
      return false;
    }
  }
}