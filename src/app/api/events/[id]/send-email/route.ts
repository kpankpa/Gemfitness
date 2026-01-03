import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { sendEmail } from '@/lib/services/email/mock';

// POST /api/events/[id]/send-email - Send bulk email to event attendees
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { subject, message, recipientFilter } = body;

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Build filter for attendees
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      eventId,
    };

    if (recipientFilter) {
      if (recipientFilter === 'registered') {
        whereClause.status = 'registered';
      } else if (recipientFilter === 'attended') {
        whereClause.status = 'attended';
      } else if (recipientFilter === 'cancelled') {
        whereClause.status = 'cancelled';
      }
    }

    // Get attendees
    const attendees = await prisma.eventBooking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (attendees.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No attendees found with the selected filter' },
        { status: 400 }
      );
    }

    // Send emails
    const emailPromises = attendees.map(async (attendee) => {
      try {
        // Check user's notification preferences
        const preferences = await prisma.notificationPreference.findUnique({
          where: { userId: attendee.user.id },
        });

        const emailEnabled = preferences?.emailEnabled !== false;
        const dashboardEnabled = preferences?.dashboardEnabled !== false;

        // Send email if enabled
        if (emailEnabled) {
          await sendEmail({
            to: attendee.user.email,
            subject,
            html: `
              <h2>${subject}</h2>
              <p>Hi ${attendee.user.firstName},</p>
              ${message}
              <hr/>
              <p><strong>Event Details:</strong></p>
              <ul>
                <li>Event: ${event.title}</li>
                <li>Date: ${new Date(event.eventDate).toLocaleDateString()}</li>
                <li>Location: ${event.location || 'GemFitness Tema'}</li>
              </ul>
              <p>Best regards,<br/>GemFitness Team</p>
            `,
          });
        }

        // Create dashboard notification if enabled
        if (dashboardEnabled) {
          await prisma.notification.create({
            data: {
              userId: attendee.user.id,
              type: 'EVENT_REMINDER',
              subject,
              message: `${message}\n\nEvent: ${event.title}\nDate: ${new Date(
                event.eventDate
              ).toLocaleDateString()}`,
              sentAt: new Date(),
              status: 'sent',
            },
          });
        }

        return { success: true, email: attendee.user.email };
      } catch (error) {
        console.error(`Failed to send email to ${attendee.user.email}:`, error);
        return { success: false, email: attendee.user.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Email sent to ${successCount} attendees`,
      details: {
        total: attendees.length,
        successful: successCount,
        failed: failedCount,
        results,
      },
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send bulk email' },
      { status: 500 }
    );
  }
}
