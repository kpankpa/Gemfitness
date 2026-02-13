/**
 * Event Promotional Email API
 * Manually send promotional emails for events
 * 
 * /api/events/[id]/promote
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { sendEventPromotionalEmail } from '@/lib/services/email/event-emails';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/promote
 * Send promotional email for an event
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

    // Only managers and admins can send promotional emails
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetAudience = 'all', customMessage } = body;

    // Validate target audience
    if (!['all', 'members', 'new'].includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid target audience. Must be: all, members, or new' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot promote a cancelled event' },
        { status: 400 }
      );
    }

    if (event.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot promote a completed event' },
        { status: 400 }
      );
    }

    // Send promotional emails
    logger.info('Sending promotional emails:', {
      eventId,
      title: event.title,
      targetAudience,
    });

    const result = await sendEventPromotionalEmail({
      eventId,
      targetAudience: targetAudience as 'all' | 'members' | 'new',
      customMessage,
    });

    logger.info('Promotional emails sent:', {
      eventId,
      recipients: result.recipientCount,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Promotional emails sent successfully',
      event: {
        id: event.id,
        title: event.title,
      },
      stats: {
        recipientCount: result.recipientCount,
        errorCount: result.errors.length,
        targetAudience,
      },
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : [], // Limit errors shown
    });
  } catch (error) {
    logger.error('Error sending promotional emails:', error);
    return NextResponse.json(
      {
        error: 'Failed to send promotional emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
