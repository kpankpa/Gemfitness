import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cron/close-registrations - Auto-close registrations past deadline
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find events where registration deadline has passed
    const eventsToClose = await prisma.event.findMany({
      where: {
        registrationDeadline: {
          lte: now
        },
        status: 'UPCOMING',
        registrationClosed: false,
        autoCloseRegistration: true,
      },
      select: {
        id: true,
        title: true,
        registrationDeadline: true,
        eventDate: true,
      }
    });

    const closedEvents = [];

    for (const event of eventsToClose) {
      // Get registration count
      const registrationCount = await prisma.eventBooking.count({
        where: {
          eventId: event.id,
          status: { in: ['registered', 'confirmed'] }
        }
      });

      // Close registration
      await prisma.event.update({
        where: { id: event.id },
        data: {
          registrationClosed: true,
        }
      });

      // Get registered users for notifications
      const registrations = await prisma.eventBooking.findMany({
        where: {
          eventId: event.id,
          status: { in: ['registered', 'confirmed'] }
        },
        include: {
          user: {
            select: { id: true }
          }
        }
      });

      // Create notifications for all registered users
      if (registrations.length > 0) {
        await prisma.notification.createMany({
          data: registrations.map(registration => ({
            userId: registration.user.id,
            type: 'EVENT_REMINDER',
            subject: `Registration Closed: ${event.title}`,
            message: `Registration for ${event.title} has been closed. The event is on ${new Date(event.eventDate).toLocaleDateString()}. We look forward to seeing you there!`,
            status: 'pending',
          }))
        });
      }

      closedEvents.push({
        id: event.id,
        title: event.title,
        registrationsCount: registrationCount,
        deadlinePassed: event.registrationDeadline,
      });

      console.log(`Closed registration for event: ${event.title} (${registrationCount} registrations)`);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${eventsToClose.length} events`,
      closedEvents,
      processedAt: now.toISOString(),
    });

  } catch (error) {
    console.error('Error in close-registrations cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process registration closures' },
      { status: 500 }
    );
  }
}