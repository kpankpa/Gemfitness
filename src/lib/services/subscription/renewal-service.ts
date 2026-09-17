/**
 * Subscription Renewal Service
 * Handles automatic renewal, retry logic, and renewal status tracking
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPlanPricing, calculateEndDate } from '@/lib/pricing';
import { paystackService } from '@/lib/services/paystack';
import {
  sendRenewalSuccessEmail,
  sendRenewalFailedEmail,
  sendPaymentMethodRequiredEmail,
} from '@/lib/services/email/renewal-emails';

export interface RenewalResult {
  success: boolean;
  subscriptionId: string;
  message: string;
  newEndDate?: Date;
  amount?: number;
  paymentReference?: string;
  nextRetryAt?: Date;
}

/**
 * Process subscription renewal
 */
export async function processSubscriptionRenewal(subscriptionId: string): Promise<RenewalResult> {
  let subscription;
  
  try {
    // Get subscription with user info
    subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      return {
        success: false,
        subscriptionId,
        message: 'Subscription not found'
      };
    }

    // Check if subscription is valid for renewal
    if (subscription.status === 'CANCELLED') {
      return {
        success: false,
        subscriptionId,
        message: 'Cannot renew cancelled subscription'
      };
    }

      // Skip DAILY plans because day passes do not renew automatically.
    if (subscription.plan === 'DAILY') {
      return {
        success: false,
        subscriptionId,
        message: 'Day passes do not auto-renew'
      };
    }

    // Skip paused and other non-renewable statuses
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'EXPIRED') {
      return {
        success: false,
        subscriptionId,
        message: `Subscription status is ${subscription.status}, cannot renew`
      };
    }

    const planPricing = getPlanPricing(subscription.plan);
    const amount = planPricing.price;
    
    const renewalAttempt = (subscription.renewalAttemptsCount || 0) + 1;
    const maxAttempts = subscription.maxRenewalAttempts || 3;

    // Check if we've exceeded max attempts
    if (renewalAttempt > maxAttempts) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'EXPIRED'
        }
      });

      logger.error('Renewal failed - max attempts exceeded:', {
        subscriptionId,
        attempts: renewalAttempt
      });

      // Send failure notification
      await sendRenewalFailedEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        reason: 'Max renewal attempts exceeded. Please renew manually.',
        renewalAmount: amount
      });

      return {
        success: false,
        subscriptionId,
        message: 'Max renewal attempts exceeded'
      };
    }

    // Check if user has payment method stored
    const paymentMethodId = subscription.paymentMethodId;
    
    if (!paymentMethodId) {
      logger.warn('No payment method for renewal:', {
        subscriptionId,
        userId: subscription.userId
      });

      // Send email to update payment method
      await sendPaymentMethodRequiredEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        renewalDueDate: subscription.endDate
      });

      return {
        success: false,
        subscriptionId,
        message: 'No payment method on file',
        nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Retry tomorrow
      };
    }

    logger.info('Processing renewal for subscription:', {
      subscriptionId,
      userId: subscription.userId,
      plan: subscription.plan,
      amount
    });

    // Create renewal record and attempt payment
    const renewalRecord = await prisma.subscriptionRenewal.create({
      data: {
        subscriptionId,
        attemptNumber: renewalAttempt,
        status: 'PROCESSING',
        amount
      }
    });

    // Attempt to charge via Paystack using stored authorization
    let paymentSuccess = false;
    let paymentReference: string | undefined;
    let failureReason = '';
    let errorCode = '';

    try {
      // Use Paystack to charge stored authorization
      const chargeResult = await paystackService.chargeAuthorization({
        authorization_code: paymentMethodId,
        email: subscription.user.email,
        amount: Math.round(amount * 100), // Convert to kobo
        reference: `RENEWAL_${subscriptionId}_${Date.now()}`
      });

      if (chargeResult.status && typeof chargeResult.data === 'object' && 'reference' in chargeResult.data) {
        paymentReference = (chargeResult.data as Record<string, string>).reference;
        paymentSuccess = true;

        logger.info('Renewal payment successful:', {
          subscriptionId,
          reference: paymentReference,
          amount
        });
      } else {
        failureReason = chargeResult.message || 'Payment failed';
        const dataWithError = chargeResult.data as Record<string, unknown>;
        errorCode = ((dataWithError?.error as Record<string, string>)?.code) || 'UNKNOWN';
      }
    } catch (paymentError) {
      failureReason = paymentError instanceof Error ? paymentError.message : 'Payment processing error';
      errorCode = 'PAYMENT_ERROR';

      logger.error('Renewal payment error:', {
        subscriptionId,
        error: failureReason
      });
    }

    // Update renewal record with result
    if (paymentSuccess) {
      const newEndDate = calculateEndDate(planPricing.durationDays);

      // Update subscription
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          endDate: newEndDate
        }
      });

      // Update renewal record
      await prisma.subscriptionRenewal.update({
        where: { id: renewalRecord.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          ...(paymentReference ? { paymentReference } : {})
        }
      });

      // Send success email
      await sendRenewalSuccessEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        newEndDate,
        amount,
        renewalCount: renewalAttempt
      });

      return {
        success: true,
        subscriptionId,
        message: 'Subscription renewed successfully',
        newEndDate,
        amount,
        ...(paymentReference ? { paymentReference } : {})
      };
    } else {
      // Payment failed - schedule retry
      const nextRetryAt = new Date();
      
      // Exponential backoff: 1 hour, 6 hours, 24 hours
      if (renewalAttempt === 1) {
        nextRetryAt.setHours(nextRetryAt.getHours() + 1);
      } else if (renewalAttempt === 2) {
        nextRetryAt.setHours(nextRetryAt.getHours() + 6);
      } else {
        nextRetryAt.setHours(nextRetryAt.getHours() + 24);
      }

      // Note: We don't update extended renewal fields as they're not in current schema types
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: subscription.status, // Keep current status
          renewalAttemptsCount: renewalAttempt,
          lastRenewalAttemptAt: new Date(),
          lastRenewalFailureReason: failureReason
        }
      });

      await prisma.subscriptionRenewal.update({
        where: { id: renewalRecord.id },
        data: {
          status: 'FAILED',
          failureReason,
          errorCode,
          retryAfter: nextRetryAt
        }
      });

      logger.warn('Renewal failed, scheduling retry:', {
        subscriptionId,
        attempt: renewalAttempt,
        reason: failureReason,
        nextRetry: nextRetryAt
      });

      // Send retry notification email
      await sendRenewalFailedEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        reason: `Payment failed: ${failureReason}. We'll retry in ${renewalAttempt === 1 ? '1 hour' : renewalAttempt === 2 ? '6 hours' : '24 hours'}.`,
        renewalAmount: amount
      });

      return {
        success: false,
        subscriptionId,
        message: `Renewal failed: ${failureReason}`,
        nextRetryAt
      };
    }
  } catch (error) {
    logger.error('Renewal processing error:', {
      subscriptionId,
      error: error instanceof Error ? error.message : String(error)
    });

    // Update subscription status to reflect error
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: subscription.status // Keep current status
        }
      });
    }

    return {
      success: false,
      subscriptionId,
      message: 'Internal error processing renewal'
    };
  }
}

/**
 * Get all subscriptions due for renewal
 */
export async function getSubscriptionsDueForRenewal() {
  const now = new Date();
  
  // Get subscriptions where nextRenewalDate has passed and not recently attempted

  const subscriptions = await prisma.subscription.findMany({
    where: {
      AND: [
        { status: { not: 'CANCELLED' } },
        { status: { in: ['ACTIVE', 'EXPIRED'] } },
        { plan: { not: 'DAILY' } }, // Day passes don't auto-renew
        { endDate: { lte: now } },  // Subscription has expired or is due
        { endDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Within last 7 days (avoid processing very old ones)
      ]
    },
    include: { user: true }
  });

  return subscriptions;
}

/**
 * Manually trigger renewal for a subscription (admin/user action)
 */
export async function manualRenewalRequest(subscriptionId: string, userId: string): Promise<RenewalResult> {
  // Verify user owns the subscription or is admin
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) {
    return {
      success: false,
      subscriptionId,
      message: 'Subscription not found'
    };
  }

  if (subscription.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      return {
        success: false,
        subscriptionId,
        message: 'Unauthorized'
      };
    }
  }

  // Reset renewal attempts to allow retry
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      renewalAttemptsCount: 0,
      renewalStatus: 'PENDING'
    }
  });

  // Process renewal
  return processSubscriptionRenewal(subscriptionId);
}

/**
 * Handle renewal failure and determine next action
 */
export async function handleRenewalFailure(
  subscriptionId: string,
  reason: string,
  errorCode?: string
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) return;

  const newAttempt = subscription.renewalAttemptsCount + 1;

  // Determine if we should keep retrying
  let shouldRetry = newAttempt <= subscription.maxRenewalAttempts;

  // Don't retry if error is permanent (e.g., card expired, insufficient funds)
  const permanentErrorCodes = [
    'insufficient_funds',
    'card_expired',
    'invalid_card',
    'lost_card',
    'stolen_card'
  ];

  if (permanentErrorCodes.includes(errorCode?.toLowerCase() || '')) {
    shouldRetry = false;
  }

  if (shouldRetry) {
    // Schedule retry
    const nextRetry = new Date();
    nextRetry.setHours(nextRetry.getHours() + (newAttempt * 6)); // Incremental backoff

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        renewalStatus: 'FAILED',
        lastRenewalFailureReason: reason
      }
    });
  } else {
    // Mark as failed, expire subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'EXPIRED',
        lastRenewalFailureReason: reason
      }
    });
  }
}

/**
 * Update payment method for renewal
 */
export async function updatePaymentMethod(
  subscriptionId: string,
  authorizationCode: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) {
    return { success: false, message: 'Subscription not found' };
  }

  if (subscription.userId !== userId) {
    const requestingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (requestingUser?.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }
  }

  // Store authorization code for future charges
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      paymentMethodId: authorizationCode,
      renewalStatus: 'PENDING' // Mark for next scheduled renewal
    }
  });

  logger.info('Payment method updated for renewal:', {
    subscriptionId,
    userId
  });

  return { success: true, message: 'Payment method updated successfully' };
}
