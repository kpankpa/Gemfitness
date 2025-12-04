import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]
 * Get details of a specific event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        location: event.location,
        image: event.image,
        maxAttendees: event.maxAttendees,
        registered: event._count.bookings,
        isFree: event.isFree,
        price: event.price,
        status: event.status,
        createdBy: event.createdBy,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[id]
 * Update an event
 * Requires MANAGER or ADMIN role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate pricing if changing
    if (isFree === false && !price && !existingEvent.price) {
      return NextResponse.json(
        { error: 'Price is required for paid events' },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location && { location }),
        ...(image !== undefined && { image }),
        ...(maxAttendees !== undefined && { maxAttendees: maxAttendees ? parseInt(maxAttendees) : null }),
        ...(isFree !== undefined && { isFree: Boolean(isFree) }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(status && { status: status as $Enums.EventStatus })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        eventDate: updatedEvent.eventDate.toISOString(),
        endDate: updatedEvent.endDate?.toISOString() || null,
        location: updatedEvent.location,
        image: updatedEvent.image,
        maxAttendees: updatedEvent.maxAttendees,
        isFree: updatedEvent.isFree,
        price: updatedEvent.price,
        status: updatedEvent.status
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event
 * Requires MANAGER or ADMIN role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if there are registrations
    if (existingEvent._count.bookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete event with existing registrations. Cancel the event instead.' },
        { status: 400 }
      );
    }

    await prisma.event.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
