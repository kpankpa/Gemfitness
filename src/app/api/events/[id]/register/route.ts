import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/register
 * Register for an event
 */
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
    const { userId } = body;

    // Use session userId if not provided
    const targetUserId = userId || session.userId;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: 'registered' }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is not cancelled or completed
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: `Cannot register for ${event.status.toLowerCase()} event` 
      }, { status: 400 });
    }

    // Check capacity
    if (event.maxAttendees && event._count.bookings >= event.maxAttendees) {
      return NextResponse.json({ 
        error: 'Event is full' 
      }, { status: 400 });
    }

    // Check if already registered
    const existingBooking = await prisma.eventBooking.findFirst({
      where: {
        userId: targetUserId,
        eventId: eventId,
        status: 'registered'
      }
    });

    if (existingBooking) {
      return NextResponse.json({ 
        error: 'Already registered for this event' 
      }, { status: 400 });
    }

    // Create registration
    const booking = await prisma.eventBooking.create({
      data: {
        userId: targetUserId,
        eventId: eventId,
        status: 'registered'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        event: {
          select: {
            title: true,
            eventDate: true,
            location: true,
            isFree: true,
            price: true
          }
        }
      }
    });

    // Generate QR code for ticket (simple format)
    const ticketQRCode = `EVENT-${event.id}-USER-${targetUserId}-${booking.id}`;

    return NextResponse.json({
      success: true,
      message: 'Successfully registered for event',
      registration: {
        id: booking.id,
        userName: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        phone: booking.user.phone,
        eventTitle: booking.event.title,
        eventDate: booking.event.eventDate.toISOString(),
        location: booking.event.location,
        isFree: booking.event.isFree,
        price: booking.event.price,
        ticketQRCode: ticketQRCode,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/register
 * Cancel event registration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Only allow cancelling your own registration or if you're staff
    if (userId !== session.userId && !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find booking
    const booking = await prisma.eventBooking.findFirst({
      where: {
        userId: userId,
        eventId: eventId,
        status: 'registered'
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'No active registration found' 
      }, { status: 404 });
    }

    // Cancel booking
    await prisma.eventBooking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    );
  }
}
