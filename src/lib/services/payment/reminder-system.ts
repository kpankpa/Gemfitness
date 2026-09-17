// Payment Reminder System
// src/lib/services/payment/reminder-system.ts

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { sendEmail, sendExpiryReminderEmail } from '@/lib/services/email/mock';

export class PaymentReminderSystem {
  // Check for upcoming subscription expirations and send reminders
  static async processPaymentReminders(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
      const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));

      // Find subscriptions expiring in 3 days
      await this.sendExpiryReminders(threeDaysFromNow, '3_DAY_REMINDER');
      
      // Find subscriptions expiring in 1 day  
      await this.sendExpiryReminders(oneDayFromNow, '1_DAY_REMINDER');
      
      // Find expired subscriptions (grace period)
      await this.processExpiredSubscriptions();

      logger.info('✅ Payment reminders processed successfully');

    } catch (error) {
      logger.error('❌ Payment reminder processing error:', error);
      throw error;
    }
  }

  private static async sendExpiryReminders(expiryDate: Date, reminderType: string): Promise<void> {
    // Find subscriptions expiring on the target date (skip DAILY day passes)
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: { not: 'DAILY' },
        endDate: {
          gte: new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()),
          lt: new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate() + 1)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            notificationPreferences: true
          }
        }
      }
    });

    for (const subscription of expiringSubscriptions) {
      // Check if user wants payment reminders
      if (subscription.user.notificationPreferences?.expiryWarnings === false) {
        continue;
      }

      // Check if we've already sent this reminder
      const existingReminder = await prisma.notification.findFirst({
        where: {
          userId: subscription.user.id,
          type: 'EXPIRY_WARNING',
          message: { contains: reminderType },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        }
      });

      if (existingReminder) {
        continue; // Already sent
      }

      // Create notification record
      const daysRemaining = reminderType === '3_DAY_REMINDER' ? 3 : 1;
      const planPrice = this.getPlanPrice(subscription.plan);
      
      const subject = `Membership Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`;
      const message = `Hi ${subscription.user.firstName},\n\nYour ${this.formatPlan(subscription.plan)} membership expires on ${subscription.endDate.toLocaleDateString('en-GB')}.\n\nRenewal Amount: GH₵ ${planPrice}\nPayment Methods: MTN MoMo (059 893 4010), Cash, or Card\n\nRenew now to avoid interruption to your fitness journey!\n\n${reminderType}`;

      const emailResult = await sendExpiryReminderEmail(
        subscription.user.email,
        subscription.user.firstName,
        daysRemaining
      );

      await prisma.notification.create({
        data: {
          userId: subscription.user.id,
          type: 'EXPIRY_WARNING',
          subject,
          message,
          status: emailResult.success ? 'sent' : 'pending',
        },
      });

      logger.info(`📧 ${reminderType} sent to:`, {
        userId: subscription.user.id,
        email: subscription.user.email,
        expiryDate: subscription.endDate,
        emailSuccess: emailResult.success,
      });
    }
  }

  private static async processExpiredSubscriptions(): Promise<void> {
    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

    // Find subscriptions that expired more than 7 days ago (skip DAILY day passes)
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        plan: { not: 'DAILY' },
        endDate: { lt: gracePeriodEnd }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    for (const subscription of expiredSubscriptions) {
      // Mark subscription as expired
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' }
      });

      const subject = 'Membership Expired - Renew Now';
      const message = `Hi ${subscription.user.firstName},\n\nYour membership has expired. Please renew to continue accessing the gym.\n\nVisit the gym or contact us to renew your membership.\n\nWe look forward to seeing you back at Gemfitness!`;

      const emailResult = await sendEmail({
        to: subscription.user.email,
        subject,
        html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
      });

      await prisma.notification.create({
        data: {
          userId: subscription.user.id,
          type: 'SUBSCRIPTION_EXPIRED',
          subject,
          message,
          status: emailResult.success ? 'sent' : 'pending',
        },
      });

      logger.info('🔴 Subscription expired:', {
        subscriptionId: subscription.id,
        userId: subscription.user.id,
        expiredDate: subscription.endDate,
        emailSuccess: emailResult.success,
      });
    }
  }

  // Process failed payment retries
  static async processFailedPaymentRetries(): Promise<void> {
    const retryWindow = new Date(Date.now() - (24 * 60 * 60 * 1000)); // 24 hours ago

    const failedPayments = await prisma.paymentTransaction.findMany({
      where: {
        status: 'failed',
        createdAt: { gte: retryWindow },
        metadata: {
          path: ['retryCount'],
          lt: 3 // Less than 3 retries
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    });

    for (const payment of failedPayments) {
      const retryCount = (payment.metadata as any)?.retryCount || 0;
      
      if (retryCount < 3) {
        const subject = 'Payment Failed - Please Try Again';
        const message = `Hi ${payment.user!.firstName},\n\nYour payment of GH₵ ${payment.amount} failed (Reference: ${payment.reference}).\n\nPlease try again or use a different payment method.\n\nAttempt ${retryCount + 1} of 3`;

        const emailResult = await sendEmail({
          to: payment.user!.email,
          subject,
          html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
        });

        await prisma.notification.create({
          data: {
            userId: payment.user!.id,
            type: 'PAYMENT_FAILED',
            subject,
            message,
            status: emailResult.success ? 'sent' : 'pending',
          },
        });

        // Update retry count
        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            metadata: {
              ...(payment.metadata as object),
              retryCount: retryCount + 1
            }
          }
        });
      }
    }
  }

  private static getPlanPrice(plan: string): number {
    switch (plan) {
      case 'DAILY': return 30;
      case 'ONE_MONTH': return 200;
      case 'THREE_MONTHS': return 500;
      case 'ONE_YEAR': return 2200;
      default: return 0;
    }
  }

  private static formatPlan(plan: string): string {
    switch (plan) {
      case 'DAILY': return 'Day Pass';
      case 'ONE_MONTH': return '1 Month';
      case 'THREE_MONTHS': return '3 Months';
      case 'ONE_YEAR': return '1 Year';
      default: return plan;
    }
  }
}

// Cron job handler for automated reminders
export async function processScheduledPaymentReminders() {
  try {
    await PaymentReminderSystem.processPaymentReminders();
    await PaymentReminderSystem.processFailedPaymentRetries();
    
    return { success: true, message: 'Payment reminders processed' };
  } catch (error) {
    logger.error('❌ Scheduled payment reminder error:', error);
    return { success: false, error: 'Failed to process payment reminders' };
  }
}