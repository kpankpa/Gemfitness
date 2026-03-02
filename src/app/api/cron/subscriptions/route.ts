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
    // 3. SEND RENEWAL REMINDERS (7 / 3 / 1 DAY MILESTONES)
    // ============================================
    logger.info('📋 Phase 3: Sending multi-milestone renewal reminders...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch all active subscriptions expiring within 7 days
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: { user: true },
    });

    // Ordered ascending so .find() returns the nearest ceiling milestone (1 → 3 → 7)
    const REMINDER_MILESTONES: readonly number[] = [1, 3, 7];

    for (const subscription of expiringSubscriptions) {
      const daysLeft = Math.ceil(
        (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which milestone this subscription falls under (pick closest ≥ daysLeft)
      const targetMilestone = REMINDER_MILESTONES.find(m => daysLeft <= m) ?? null;

      if (!targetMilestone) continue;

      // Dedup: don't send the same milestone reminder if already sent within 23h
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId: subscription.userId,
          type: 'EXPIRY_WARNING',
          subject: { contains: `cron-${targetMilestone}day` },
          sentAt: { gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
        },
      });

      if (alreadySent) {
        logger.info(`⏭️  ${targetMilestone}-day reminder already sent to ${subscription.user.email}, skipping`);
        continue;
      }

      // Send email
      const emailResult = await sendRenewalEmails.sendRenewalReminderEmail({
        to: subscription.user.email,
        firstName: subscription.user.firstName,
        daysUntilExpiry: daysLeft,
        amount: subscription.amount,
      });

      if (emailResult.success) {
        // Record notification to prevent duplicate sends
        await prisma.notification.create({
          data: {
            userId: subscription.userId,
            type: 'EXPIRY_WARNING',
            subject: `cron-${targetMilestone}day renewal reminder`,
            message: `Automated ${targetMilestone}-day renewal reminder sent to ${subscription.user.email}. ${daysLeft} days until expiry.`,
            status: 'sent',
            sentAt: now,
          },
        });
        stats.reminderseSent++;
        logger.info(`✅ Sent ${targetMilestone}-day reminder to ${subscription.user.email}`);
      } else {
        logger.warn(`❌ Failed to send reminder to ${subscription.user.email}: ${emailResult.error}`);
      }
    }

    logger.info(`Sent ${stats.reminderseSent} renewal reminders across 7/3/1-day milestones`);

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
