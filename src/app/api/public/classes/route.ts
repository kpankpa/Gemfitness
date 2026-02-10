import { NextRequest, NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/classes
 * Public endpoint: List classes for landing page display
 * NO AUTHENTICATION REQUIRED
 * 
 * Returns MINIMAL public data for landing page:
 * - name, type, schedule, brief description
 * - Does NOT return: capacity, instructor, pricing, bookings
 * - Only shows ACTIVE classes
 * 
 * Query params: limit (default 6)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20); // Max 20 for public

    // Only return active classes
    const classes = await prisma.class.findMany({
      where: {
        status: 'ACTIVE' as $Enums.ClassStatus,
      },
      select: {
        // MINIMAL public info only
        id: true,
        name: true,
        description: true,
        type: true,
        schedule: true,
        duration: true,
        // EXCLUDED: instructor, maxCapacity, currentBookings, price, internal data
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform to safe public format with truncated descriptions
    const publicClasses = classes.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description?.substring(0, 150) + (c.description && c.description.length > 150 ? '...' : ''),
      type: c.type,
      schedule: c.schedule,
      duration: c.duration,
    }));

    return NextResponse.json(
      { 
        success: true,
        classes: publicClasses,
        total: publicClasses.length,
      },
      { 
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache 5 min
        }
      }
    );
  } catch (error) {
    console.error('Error fetching public classes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
