import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]/attendees
 * Get list of all attendees/registrations for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff can view full attendee lists
    if (!['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ 
        error: 'Forbidden - Staff access required' 
      }, { status: 403 });
    }

    const { id: eventId } = await params;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        eventDate: true,
        location: true,
        maxAttendees: true,
        isFree: true,
        price: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get all registrations
    const registrations = await prisma.eventBooking.findMany({
      where: {
        eventId: eventId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              select: {
                plan: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format attendee data
    const attendees = registrations.map(r => {
      const ticketQRCode = `EVENT-${eventId}-USER-${r.userId}-${r.id}`;
      
      return {
        id: r.id,
        userId: r.user.id,
        name: `${r.user.firstName} ${r.user.lastName}`,
        email: r.user.email,
        phone: r.user.phone,
        profileImage: r.user.profileImage,
        membershipPlan: r.user.subscriptions[0]?.plan || 'NONE',
        isMember: r.user.subscriptions.length > 0,
        registeredAt: r.createdAt.toISOString(),
        status: r.status,
        ticketQRCode: ticketQRCode,
        paymentStatus: event.isFree ? 'FREE' : 'PENDING' // TODO: Integrate payment tracking
      };
    });

    // Calculate statistics
    const registered = attendees.filter(a => a.status === 'registered').length;
    const stats: {
      total: number;
      registered: number;
      attended: number;
      cancelled: number;
      members: number;
      nonMembers: number;
      capacity: number | string;
      spotsLeft: number | null;
      revenue: number;
    } = {
      total: registrations.length,
      registered: registered,
      attended: attendees.filter(a => a.status === 'attended').length,
      cancelled: attendees.filter(a => a.status === 'cancelled').length,
      members: attendees.filter(a => a.isMember).length,
      nonMembers: attendees.filter(a => !a.isMember).length,
      capacity: event.maxAttendees || 'Unlimited',
      spotsLeft: event.maxAttendees ? Math.max(0, event.maxAttendees - registered) : null,
      revenue: event.isFree ? 0 : (registered * (event.price || 0))
    };

    return NextResponse.json({
      success: true,
      event: {
        title: event.title,
        eventDate: event.eventDate.toISOString(),
        location: event.location,
        isFree: event.isFree,
        price: event.price
      },
      stats: stats,
      attendees: attendees
    });
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]/attendees
 * Update attendee status (e.g., mark as attended during check-in)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff can update attendee status
    if (!['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ 
        error: 'Forbidden - Staff access required' 
      }, { status: 403 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, status' 
      }, { status: 400 });
    }

    // Find booking
    const booking = await prisma.eventBooking.findFirst({
      where: {
        userId: userId,
        eventId: eventId
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }

    // Update status
    const updated = await prisma.eventBooking.update({
      where: { id: booking.id },
      data: { status: status }
    });

    return NextResponse.json({
      success: true,
      message: 'Attendee status updated',
      booking: {
        id: updated.id,
        status: updated.status
      }
    });
  } catch (error) {
    console.error('Error updating attendee status:', error);
    return NextResponse.json(
      { error: 'Failed to update attendee status' },
      { status: 500 }
    );
  }
}
