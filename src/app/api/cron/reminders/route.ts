/**
 * Cron Job Endpoint for Scheduled Tasks
 * Handles automated reminders and maintenance tasks
 * 
 * /api/cron/reminders
 * 
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * Schedule: Every hour
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEventReminderEmails } from '@/lib/services/email/event-emails';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/reminders
 * Send automated reminder emails for upcoming events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      eventsProcessed: 0,
      remindersType: [] as string[],
      totalRecipients: 0,
      errors: [] as string[],
    };

    // Get current time
    const now = new Date();

    // ========================================
    // 24-Hour Event Reminders
    // ========================================
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    const upcomingEvents24h = await prisma.event.findMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        eventDate: {
          gte: twentyThreeHoursFromNow,
          lte: twentyFourHoursFromNow,
        },
      },
      include: {
        bookings: {
          where: {
            status: { in: ['registered', 'confirmed'] },
          },
        },
      },
    });

    for (const event of upcomingEvents24h) {
      try {
        // Check if we've already sent 24h reminder
        const existingReminders = await prisma.notification.findMany({
          where: {
            type: 'EVENT_REMINDER',
            message: {
              contains: event.title,
            },
            sentAt: {
              gte: twentyThreeHoursFromNow,
            },
          },
          take: 1,
        });

        if (existingReminders.length > 0) {
          logger.info(`24h reminder already sent for event: ${event.title}`);
          continue;
        }

        if (event.bookings.length === 0) {
          logger.info(`No bookings for event: ${event.title} - skipping reminder`);
          continue;
        }

        const result = await sendEventReminderEmails({
          eventId: event.id,
          hoursBeforeEvent: 24,
        });

        results.eventsProcessed++;
        results.remindersType.push('24h');
        results.totalRecipients += result.recipientCount;

        if (result.errors.length > 0) {
          results.errors.push(
            ...result.errors.map((e) => `24h reminder - ${event.title}: ${e}`)
          );
        }

        logger.info(`24h reminder sent for event: ${event.title}`, {
          recipients: result.recipientCount,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to send 24h reminder for ${event.title}: ${errorMsg}`);
        logger.error(`Error sending 24h reminder:`, { event: event.title, error });
      }
    }

    // ========================================
    // 2-Hour Event Reminders (Optional)
    // ========================================
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const oneHourFiftyFromNow = new Date(now.getTime() + 110 * 60 * 1000);

    const upcomingEvents2h = await prisma.event.findMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        eventDate: {
          gte: oneHourFiftyFromNow,
          lte: twoHoursFromNow,
        },
      },
      include: {
        bookings: {
          where: {
            status: { in: ['registered', 'confirmed'] },
          },
        },
      },
    });

    for (const event of upcomingEvents2h) {
      try {
        // Check if we've already sent 2h reminder
        const existingReminders = await prisma.notification.findMany({
          where: {
            type: 'EVENT_REMINDER',
            message: {
              contains: `${event.title} in 2 hours`,
            },
            sentAt: {
              gte: oneHourFiftyFromNow,
            },
          },
          take: 1,
        });

        if (existingReminders.length > 0) {
          logger.info(`2h reminder already sent for event: ${event.title}`);
          continue;
        }

        if (event.bookings.length === 0) {
          continue;
        }

        const result = await sendEventReminderEmails({
          eventId: event.id,
          hoursBeforeEvent: 2,
        });

        results.eventsProcessed++;
        results.remindersType.push('2h');
        results.totalRecipients += result.recipientCount;

        if (result.errors.length > 0) {
          results.errors.push(
            ...result.errors.map((e) => `2h reminder - ${event.title}: ${e}`)
          );
        }

        logger.info(`2h reminder sent for event: ${event.title}`, {
          recipients: result.recipientCount,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to send 2h reminder for ${event.title}: ${errorMsg}`);
        logger.error(`Error sending 2h reminder:`, { event: event.title, error });
      }
    }

    // ========================================
    // Auto-update event statuses
    // ========================================
    const pastEvents = await prisma.event.updateMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        eventDate: {
          lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours past
        },
      },
      data: {
        status: 'COMPLETED',
      },
    });

    if (pastEvents.count > 0) {
      logger.info(`Auto-completed ${pastEvents.count} past events`);
    }

    // ========================================
    // Clean up expired pending bookings
    // ========================================
    const expiredBookings = await prisma.pendingEventBooking.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    if (expiredBookings.count > 0) {
      logger.info(`Cleaned up ${expiredBookings.count} expired pending bookings`);
    }

    logger.info('Cron job completed successfully:', results);

    return NextResponse.json({
      success: true,
      message: 'Reminders processed successfully',
      stats: {
        eventsProcessed: results.eventsProcessed,
        remindersSent: results.remindersType.length,
        totalRecipients: results.totalRecipients,
        errorCount: results.errors.length,
        eventsCompleted: pastEvents.count,
        bookingsCleaned: expiredBookings.count,
      },
      errors: results.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/reminders
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/reminders',
    description: 'Automated reminder system for events',
    schedule: 'Hourly',
    features: [
      '24-hour event reminders',
      '2-hour event reminders',
      'Auto-complete past events',
      'Clean expired pending bookings',
    ],
  });
}
