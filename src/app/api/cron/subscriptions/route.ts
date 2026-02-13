/**
 * Cron Job - Process Subscription Renewals
 * Handles automatic renewal, retries, and maintenance
 * 
 * Should be called every hour by external service
 * Example: curl -X GET "https://yourapp.com/api/cron/subscriptions" \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { processSubscriptionRenewal, getSubscriptionsDueForRenewal } from '@/lib/services/subscription/renewal-service';
import { processAutoResumeSubscriptions } from '@/lib/services/subscription/pause-resume-service';
import { sendRenewalEmails } from '@/lib/services/email/renewal-emails';

interface CronStats {
  renewalsProcessed: number;
  renewalsSuccessful: number;
  renewalsFailed: number;
  autoResumes: number;
  reminderseSent: number;
  duration: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const stats: CronStats = {
    renewalsProcessed: 0,
    renewalsSuccessful: 0,
    renewalsFailed: 0,
    autoResumes: 0,
    reminderseSent: 0,
    duration: 0
  };

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting subscription maintenance cron job...');

    // ============================================
    // 1. PROCESS AUTO RENEWAL
    // ============================================
    logger.info('📋 Phase 1: Checking subscriptions due for renewal...');

    const subscriptionsDueForRenewal = await getSubscriptionsDueForRenewal();
    logger.info(`Found ${subscriptionsDueForRenewal.length} subscriptions due for renewal`);

    for (const subscription of subscriptionsDueForRenewal) {
      stats.renewalsProcessed++;
      const result = await processSubscriptionRenewal(subscription.id);

      if (result.success) {
        stats.renewalsSuccessful++;
        logger.info(`✅ Renewal successful for ${subscription.user.email}`);
      } else {
        stats.renewalsFailed++;
        logger.warn(`❌ Renewal failed for ${subscription.user.email}: ${result.message}`);
      }
    }

    // ============================================
    // 2. PROCESS AUTO-RESUME
    // ============================================
    logger.info('📋 Phase 2: Processing auto-resume subscriptions...');

    const autoResumeResult = await processAutoResumeSubscriptions();
    stats.autoResumes = autoResumeResult.processedCount;

    logger.info(`Auto-resumed ${autoResumeResult.processedCount} subscriptions`);

    // ============================================
    // 3. SEND RENEWAL REMINDERS (3 DAYS BEFORE EXPIRY)
    // ============================================
    logger.info('📋 Phase 3: Sending renewal reminders...');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const subscriptionsWithinThreeDays = await prisma.subscription.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          { endDate: { gte: now, lte: threeDaysFromNow } },
          {
            // Only send reminder if we haven't sent one recently
            OR: [
              { lastRenewalAttemptAt: null },
              { lastRenewalAttemptAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
            ]
          }
        ]
      },
      include: { user: true }
    });

    for (const subscription of subscriptionsWithinThreeDays) {
      const daysUntilExpiry = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendRenewalEmails.sendRenewalReminderEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        daysUntilExpiry,
        amount: subscription.amount
      });

      stats.reminderseSent++;
    }

    logger.info(`Sent ${stats.reminderseSent} renewal reminders`);

    // ============================================
    // 4. CLEANUP: Mark EXPIRED subscriptions
    // ============================================
    logger.info('📋 Phase 4: Marking expired subscriptions...');

    const expiredCount = await prisma.subscription.updateMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          { endDate: { lt: now } }
        ]
      },
      data: {
        status: 'EXPIRED'
      }
    });

    logger.info(`Marked ${expiredCount.count} subscriptions as expired`);

    // ============================================
    // 5. CLEANUP: Remove old renewal records
    // ============================================
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const deletedRenewals = await prisma.subscriptionRenewal.deleteMany({
      where: {
        AND: [
          { status: 'SUCCESS' },
          { completedAt: { lt: thirtyDaysAgo } }
        ]
      }
    });

    logger.info(`Cleanup: Removed ${deletedRenewals.count} old renewal records`);

    stats.duration = Date.now() - startTime;

    logger.info('✅ Subscription maintenance cron completed:', stats);

    return NextResponse.json({
      success: true,
      message: 'Subscription maintenance completed',
      stats
    });
  } catch (error) {
    logger.error('❌ Subscription maintenance cron error:', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Cron job failed',
        error: error instanceof Error ? error.message : String(error),
        stats
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
