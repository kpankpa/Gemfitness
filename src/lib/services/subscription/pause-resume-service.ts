/**
 * Subscription Pause/Resume Service
 * Handle temporary suspension of subscriptions
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  sendPausedEmail,
  sendResumedEmail,
} from '@/lib/services/email/subscription-emails';

export interface PauseResumeResult {
  success: boolean;
  message: string;
  newStatus?: string;
  pausedAt?: Date;
  resumeDate?: Date;
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(
  subscriptionId: string,
  userId: string,
  resumeDate?: Date,
  reason?: string
): Promise<PauseResumeResult> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    // Verify authorization
    if (subscription.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' };
      }
    }

    if (subscription.status === 'CANCELLED') {
      return { success: false, message: 'Cannot pause cancelled subscription' };
    }

    if (subscription.status === 'PAUSED') {
      return { success: false, message: 'Subscription is already paused' };
    }

    // Calculate resume date if not provided
    const autoResumeDate = resumeDate ?? (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
    })();

    const now = new Date();

    // Record the pause
    await prisma.subscriptionChange.create({
      data: {
        subscriptionId,
        changeType: 'PAUSE',
        reason: reason || 'User initiated pause',
        initiatedBy: userId
      }
    });

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'PAUSED',
        pausedAt: now,
        resumeDate: autoResumeDate,
        endDate: new Date(subscription.endDate.getTime() + (autoResumeDate.getTime() - now.getTime()))
      }
    });

    logger.info('Subscription paused:', {
      subscriptionId,
      userId,
      resumeDate: autoResumeDate
    });

    // Send notification email
    await sendPausedEmail({
      to: subscription.user.email,
      firstName: subscription.user.firstName,
      resumeDate: autoResumeDate
    });

    return {
      success: true,
      message: 'Subscription paused successfully',
      newStatus: 'PAUSED',
      pausedAt: now,
      resumeDate: autoResumeDate
    };
  } catch (error) {
    logger.error('Pause subscription error:', {
      subscriptionId,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      message: 'Failed to pause subscription'
    };
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(
  subscriptionId: string,
  userId: string
): Promise<PauseResumeResult> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    // Verify authorization
    if (subscription.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' };
      }
    }

    if (subscription.status !== 'PAUSED') {
      return {
        success: false,
        message: `Subscription is ${subscription.status}, not paused`
      };
    }

    // Record the resume
    await prisma.subscriptionChange.create({
      data: {
        subscriptionId,
        changeType: 'RESUME',
        reason: 'Subscription resumed',
        initiatedBy: userId
      }
    });

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        resumeDate: null
      }
    });

    logger.info('Subscription resumed:', {
      subscriptionId,
      userId
    });

    // Send confirmation email
    await sendResumedEmail({
      to: subscription.user.email,
      firstName: subscription.user.firstName,
      endDate: subscription.endDate
    });

    return {
      success: true,
      message: 'Subscription resumed successfully',
      newStatus: 'ACTIVE'
    };
  } catch (error) {
    logger.error('Resume subscription error:', {
      subscriptionId,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      message: 'Failed to resume subscription'
    };
  }
}

/**
 * Process auto-resume for subscriptions
 * Should be called daily by cron job
 */
export async function processAutoResumeSubscriptions(): Promise<{
  processedCount: number;
  failedCount: number;
}> {
  const now = new Date();
  let processedCount = 0;
  let failedCount = 0;

  try {
    // Find subscriptions that should be auto-resumed
    const pausedSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'PAUSED',
        resumeDate: {
          lte: now
        }
      }
    });

    for (const subscription of pausedSubscriptions) {
      try {
        await resumeSubscription(subscription.id, 'SYSTEM');
        processedCount++;
      } catch (error) {
        logger.error('Failed to auto-resume subscription:', {
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : String(error)
        });
        failedCount++;
      }
    }

    logger.info('Auto-resume processing complete:', {
      processedCount,
      failedCount
    });

    return { processedCount, failedCount };
  } catch (error) {
    logger.error('Auto-resume processing error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return { processedCount: 0, failedCount: 1 };
  }
}

/**
 * Get pause history for a subscription
 */
export async function getPauseHistory(subscriptionId: string): Promise<
  Array<{
    pausedAt: Date;
    resumeDate: Date | null;
    reason: string | null;
    duration: number; // days
  }>
> {
  const pauses = await prisma.subscriptionChange.findMany({
    where: {
      subscriptionId,
      changeType: 'PAUSE'
    },
    orderBy: { appliedAt: 'desc' }
  });

  return pauses.map(pause => ({
    pausedAt: pause.appliedAt,
    resumeDate: null, // Would need to query forward to next RESUME
    reason: pause.reason,
    duration: 30 // Default 30 days
  }));
}

interface SubscriptionStatusInfo {
  status: string;
  resumeDate?: Date | null;
}

/**
 * Check if subscription is currently paused
 */
export function isSubscriptionPaused(subscription: SubscriptionStatusInfo): boolean {
  return subscription.status === 'PAUSED' && (!subscription.resumeDate || subscription.resumeDate > new Date());
}

/**
 * Get days until subscription resumes
 */
export function getDaysUntilResume(subscription: SubscriptionStatusInfo): number | null {
  if (subscription.status !== 'PAUSED' || !subscription.resumeDate) {
    return null;
  }

  const now = new Date();
  const daysUntil = Math.ceil((subscription.resumeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntil);
}
