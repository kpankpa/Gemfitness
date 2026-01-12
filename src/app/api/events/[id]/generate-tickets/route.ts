import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// POST /api/events/[id]/generate-tickets - Generate QR tickets for event attendees
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Get event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        eventDate: true,
        isFree: true,
        price: true,
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get confirmed bookings that need tickets
    const bookings = await prisma.eventBooking.findMany({
      where: { 
        eventId,
        status: { in: ['registered', 'confirmed'] },
        ticketId: null, // Only those without tickets
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const tickets = [];

    // Generate QR tickets for each registration
    for (const booking of bookings) {
      // Generate unique ticket ID
      const ticketId = `TKT-${event.id.slice(-6).toUpperCase()}-${booking.id.slice(-6).toUpperCase()}`;
      
      // Create QR code data
      const qrData = {
        ticketId,
        eventId: event.id,
        userId: booking.user.id,
        bookingId: booking.id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        attendeeName: `${booking.user.firstName} ${booking.user.lastName}`,
        generatedAt: new Date().toISOString(),
        // Security hash to prevent forgery
        hash: crypto.createHash('sha256')
          .update(`${ticketId}-${booking.id}-${event.id}-${process.env.NEXTAUTH_SECRET || 'secret'}`)
          .digest('hex').slice(0, 16)
      };

      // Update booking with ticket data
      await prisma.eventBooking.update({
        where: { id: booking.id },
        data: {
          ticketId,
          ticketQRData: JSON.stringify(qrData),
          ticketGeneratedAt: new Date(),
          status: 'confirmed',
        }
      });

      tickets.push({
        ticketId,
        qrData,
        attendee: {
          name: `${booking.user.firstName} ${booking.user.lastName}`,
          email: booking.user.email,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${tickets.length} tickets`,
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
      },
      tickets,
      generatedCount: tickets.length,
    });

  } catch (error) {
    console.error('Error generating tickets:', error);
    return NextResponse.json(
      { error: 'Failed to generate tickets' },
      { status: 500 }
    );
  }
}

// GET /api/events/[id]/generate-tickets - Get ticket generation status
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
        isFree: true,
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all bookings for this event
    const bookings = await prisma.eventBooking.findMany({
      where: { 
        eventId,
        status: { in: ['registered', 'confirmed'] },
      },
      select: {
        id: true,
        ticketId: true,
        ticketGeneratedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const ticketsGenerated = bookings.filter(b => b.ticketId).length;
    const totalRegistrations = bookings.length;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        isFree: event.isFree,
      },
      ticketStats: {
        generated: ticketsGenerated,
        total: totalRegistrations,
        needsGeneration: totalRegistrations - ticketsGenerated,
        allGenerated: ticketsGenerated === totalRegistrations && totalRegistrations > 0,
      },
      tickets: bookings.map(booking => ({
        ticketId: booking.ticketId,
        attendeeName: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        generatedAt: booking.ticketGeneratedAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching ticket status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket status' },
      { status: 500 }
    );
  }
}