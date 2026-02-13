/**
 * Event Cancellation API
 * Handles event cancellation with automatic refunds and notifications
 * 
 * /api/events/[id]/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { processEventRefunds } from '@/lib/services/payment/refund-service';
import { sendEventCancellationEmails } from '@/lib/services/email/event-emails';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/cancel
 * Cancel an event with automatic refunds and notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can cancel events
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason, sendNotifications = true } = body;

    // Validation
    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Event is already cancelled' },
        { status: 400 }
      );
    }

    if (event.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed event' },
        { status: 400 }
      );
    }

    // Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'CANCELLED',
      },
    });

    let refundResult = null;
    let emailResult = null;

    // Process refunds if it's a paid event
    if (!event.isFree) {
      try {
        logger.info('Processing refunds for cancelled event:', {
          eventId,
          title: event.title,
        });

        refundResult = await processEventRefunds({
          eventId,
          reason,
          processedBy: session.userId,
        });

        logger.info('Refunds processed:', {
          eventId,
          refundCount: refundResult.refundCount,
          totalAmount: refundResult.totalAmount,
        });
      } catch (error) {
        logger.error('Error processing refunds:', error);
        // Continue with notifications even if refunds fail
      }
    }

    // Send cancellation notifications
    if (sendNotifications && event._count.bookings > 0) {
      try {
        logger.info('Sending cancellation notifications:', {
          eventId,
          title: event.title,
        });

        emailResult = await sendEventCancellationEmails(
          eventId,
          reason,
          refundResult?.refundCount ? refundResult.refundCount > 0 : false
        );

        logger.info('Cancellation notifications sent:', {
          eventId,
          recipients: emailResult.recipientCount,
        });
      } catch (error) {
        logger.error('Error sending cancellation notifications:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Event cancelled successfully',
      event: {
        id: event.id,
        title: event.title,
        status: 'CANCELLED',
        reason,
      },
      refunds: refundResult
        ? {
            processed: refundResult.refundCount,
            totalAmount: refundResult.totalAmount,
            failures: refundResult.failures.length,
          }
        : null,
      notifications: emailResult
        ? {
            sent: emailResult.recipientCount,
            errors: emailResult.errors.length,
          }
        : null,
    });
  } catch (error) {
    logger.error('Error cancelling event:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
