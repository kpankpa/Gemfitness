import { NextRequest, NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/events
 * Public endpoint: List upcoming events for landing page display
 * NO AUTHENTICATION REQUIRED
 * 
 * Returns MINIMAL public data for landing page:
 * - title, date, location, category, brief description
 * - Does NOT return: pricing, capacity, attendees, registration details
 * - Only shows UPCOMING events
 * 
 * Query params: limit (default 6)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20); // Max 20 for public
    const category = searchParams.get('category');

    // Build query - only upcoming events
    const where: {
      status: $Enums.EventStatus;
      eventDate: { gte: Date };
      category?: $Enums.EventCategory;
    } = {
      status: 'UPCOMING' as $Enums.EventStatus,
      eventDate: {
        gte: new Date(), // Only future events
      },
    };
    
    if (category && Object.values($Enums.EventCategory).includes(category as $Enums.EventCategory)) {
      where.category = category as $Enums.EventCategory;
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        // MINIMAL public info only
        id: true,
        title: true,
        description: true,
        eventDate: true,
        location: true,
        category: true,
        image: true,
        // EXCLUDED: price, maxAttendees, isFree, registrations, internal data
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    });

    // Transform to safe public format with truncated descriptions
    const publicEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description?.substring(0, 150) + (e.description && e.description.length > 150 ? '...' : ''),
      date: e.eventDate.toISOString(),
      location: e.location,
      category: e.category,
      image: e.image,
    }));

    return NextResponse.json(
      { 
        success: true,
        events: publicEvents,
        total: publicEvents.length,
      },
      { 
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache 5 min
        }
      }
    );
  } catch (error) {
    console.error('❌ Error fetching public events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
