import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// POST /api/events/[id]/checkin - Check in attendee with QR code
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
    const { qrData, ticketId } = body;

    if (!qrData && !ticketId) {
      return NextResponse.json(
        { error: 'QR data or ticket ID is required' },
        { status: 400 }
      );
    }

    let parsedQrData;
    try {
      parsedQrData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch {
      return NextResponse.json(
        { error: 'Invalid QR code data' },
        { status: 400 }
      );
    }

    // Verify QR code authenticity
    const expectedHash = crypto.createHash('sha256')
      .update(`${parsedQrData.ticketId}-${parsedQrData.bookingId}-${parsedQrData.eventId}-${process.env.NEXTAUTH_SECRET || 'secret'}`)
      .digest('hex').slice(0, 16);

    if (parsedQrData.hash !== expectedHash) {
      return NextResponse.json(
        { error: 'Invalid or tampered QR code' },
        { status: 400 }
      );
    }

    // Check if ticket belongs to this event
    if (parsedQrData.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ticket is not for this event' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await prisma.eventBooking.findUnique({
      where: { id: parsedQrData.bookingId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is not confirmed' },
        { status: 400 }
      );
    }

    // Check if already checked in
    if (booking.checkedIn) {
      return NextResponse.json({
        success: false,
        error: 'Already checked in',
        alreadyCheckedIn: true,
        checkInTime: booking.checkedInAt,
        attendee: {
          name: `${booking.user.firstName} ${booking.user.lastName}`,
          email: booking.user.email,
          profileImage: booking.user.profileImage,
        }
      });
    }

    // Perform check-in
    const updatedBooking = await prisma.eventBooking.update({
      where: { id: booking.id },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: session.userId,
      },
    });

    // Get updated event statistics
    const eventStats = await prisma.eventBooking.aggregate({
      where: { 
        eventId,
        status: 'confirmed'
      },
      _count: {
        id: true,
      },
    });

    const checkedInCount = await prisma.eventBooking.count({
      where: { 
        eventId,
        checkedIn: true,
        status: 'confirmed'
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      attendee: {
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        profileImage: booking.user.profileImage,
        ticketId: parsedQrData.ticketId,
      },
      event: {
        id: booking.event.id,
        title: booking.event.title,
        eventDate: booking.event.eventDate,
      },
      checkInTime: updatedBooking.checkedInAt,
      stats: {
        totalRegistrations: eventStats._count.id,
        checkedIn: checkedInCount,
        notCheckedIn: eventStats._count.id - checkedInCount,
        attendanceRate: eventStats._count.id > 0 ? Math.round((checkedInCount / eventStats._count.id) * 100) : 0,
      }
    });

  } catch (error) {
    console.error('Error during event check-in:', error);
    return NextResponse.json(
      { error: 'Failed to process check-in' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/checkin - Get check-in statistics
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
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get check-in statistics
    const totalRegistrations = await prisma.eventBooking.count({
      where: { 
        eventId,
        status: { in: ['registered', 'confirmed'] }
      },
    });

    const checkedInCount = await prisma.eventBooking.count({
      where: { 
        eventId,
        checkedIn: true,
      },
    });

    // Get recent check-ins
    const recentCheckIns = await prisma.eventBooking.findMany({
      where: { 
        eventId,
        checkedIn: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          }
        }
      },
      orderBy: { checkedInAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      event,
      stats: {
        totalRegistrations,
        checkedIn: checkedInCount,
        notCheckedIn: totalRegistrations - checkedInCount,
        attendanceRate: totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0,
      },
      recentCheckIns: recentCheckIns.map(booking => ({
        attendeeName: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        profileImage: booking.user.profileImage,
        checkInTime: booking.checkedInAt,
        ticketId: booking.ticketId,
      }))
    });

  } catch (error) {
    console.error('Error fetching check-in stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-in statistics' },
      { status: 500 }
    );
  }
}