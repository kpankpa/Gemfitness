import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';
import { getEventStatus } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * List all events with optional filtering
 * Query params: status, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as $Enums.EventStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: { status?: $Enums.EventStatus } = {};
    if (status) where.status = status;

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      take: limit,
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    const formattedEvents = events.map(e => {
      // Auto-calculate status based on dates (preserves CANCELLED)
      const calculatedStatus = getEventStatus(e.eventDate, e.endDate, e.status);
      
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        eventDate: e.eventDate.toISOString(),
        endDate: e.endDate?.toISOString() || null,
        location: e.location,
        image: e.image,
        maxAttendees: e.maxAttendees,
        registered: e._count.bookings,
        isFree: e.isFree,
        price: e.price,
        status: calculatedStatus,
        createdBy: e.createdBy,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      total: formattedEvents.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event
 * Requires MANAGER or ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can create events
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      eventDate,
      endDate,
      location,
      image,
      maxAttendees,
      isFree,
      price,
      status
    } = body;

    // Validation
    if (!title || !description || !eventDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, eventDate' },
        { status: 400 }
      );
    }

    // Validate pricing
    if (!isFree && !price) {
      return NextResponse.json(
        { error: 'Price is required for paid events' },
        { status: 400 }
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location || 'GemFitness Tema',
        image: image || null,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        isFree: isFree !== undefined ? Boolean(isFree) : true,
        price: price ? parseFloat(price) : null,
        status: status || $Enums.EventStatus.UPCOMING,
        createdBy: session.userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        eventDate: newEvent.eventDate.toISOString(),
        endDate: newEvent.endDate?.toISOString() || null,
        location: newEvent.location,
        image: newEvent.image,
        maxAttendees: newEvent.maxAttendees,
        isFree: newEvent.isFree,
        price: newEvent.price,
        status: newEvent.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
