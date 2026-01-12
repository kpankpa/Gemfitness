import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// POST /api/events/[id]/deadline - Set registration deadline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { registrationDeadline, autoClose = true } = body;

    if (!registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline is required' },
        { status: 400 }
      );
    }

    const deadlineDate = new Date(registrationDeadline);
    const now = new Date();

    // Validate deadline is in the future
    if (deadlineDate <= now) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        eventDate: true,
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate deadline is before event date
    if (deadlineDate >= new Date(event.eventDate)) {
      return NextResponse.json(
        { error: 'Deadline must be before event date' },
        { status: 400 }
      );
    }

    // Update event with deadline
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        registrationDeadline: deadlineDate,
        autoCloseRegistration: autoClose,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration deadline set successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        eventDate: updatedEvent.eventDate,
        registrationDeadline: updatedEvent.registrationDeadline,
        autoCloseRegistration: updatedEvent.autoCloseRegistration,
      }
    });

  } catch (error) {
    console.error('Error setting registration deadline:', error);
    return NextResponse.json(
      { error: 'Failed to set deadline' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/deadline - Check deadline status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        eventDate: true,
        registrationDeadline: true,
        autoCloseRegistration: true,
        registrationClosed: true,
        status: true,
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get registration count separately
    const registrationCount = await prisma.eventBooking.count({
      where: { 
        eventId,
        status: { in: ['registered', 'confirmed'] }
      }
    });

    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const eventDate = new Date(event.eventDate);

    const deadlineStatus = {
      hasDeadline: !!deadline,
      deadline: deadline?.toISOString(),
      isPastDeadline: deadline ? now > deadline : false,
      isRegistrationOpen: event.registrationClosed ? false : (deadline ? now <= deadline : now < eventDate),
      hoursUntilDeadline: deadline ? Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))) : null,
      hoursUntilEvent: Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
    };

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        eventDate: event.eventDate,
        totalRegistrations: registrationCount,
      },
      deadlineStatus
    });

  } catch (error) {
    console.error('Error checking deadline status:', error);
    return NextResponse.json(
      { error: 'Failed to check deadline status' },
      { status: 500 }
    );
  }
}