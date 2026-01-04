import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';
import { getEventStatus } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]
 * Get details of a specific event
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

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Auto-calculate status based on dates (preserves CANCELLED)
    const calculatedStatus = getEventStatus(event.eventDate, event.endDate, event.status);

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
        status: calculatedStatus,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
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
      earlyBirdPrice,
      earlyBirdDeadline,
      category,
      tags,
      status
    } = body;

    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Status validation: Only allow manually setting CANCELLED
    if (status && status !== existingEvent.status) {
      // Calculate what the status should be based on dates
      const autoStatus = getEventStatus(existingEvent.eventDate, existingEvent.endDate, existingEvent.status);
      
      // Only allow setting CANCELLED manually
      if (status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Status is auto-calculated based on event dates. Only CANCELLED can be set manually.' },
          { status: 400 }
        );
      }
      
      // Prevent un-cancelling if event is COMPLETED
      if (existingEvent.status === 'CANCELLED' && autoStatus === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Cannot un-cancel a past event' },
          { status: 400 }
        );
      }
    }

    // Validate pricing if changing
    if (isFree === false && !price && !existingEvent.price) {
      return NextResponse.json(
        { error: 'Price is required for paid events' },
        { status: 400 }
      );
    }

    // Parse tags if provided
    const tagArray = tags ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : tags) : undefined;

    const updatedEvent = await prisma.event.update({
      where: { id },
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
        ...(earlyBirdPrice !== undefined && { earlyBirdPrice: earlyBirdPrice ? parseFloat(earlyBirdPrice) : null }),
        ...(earlyBirdDeadline !== undefined && { earlyBirdDeadline: earlyBirdDeadline ? new Date(earlyBirdDeadline) : null }),
        ...(category && { category }),
        ...(tagArray && { tags: tagArray }),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existingEvent = await prisma.event.findUnique({
      where: { id },
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
      where: { id }
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
