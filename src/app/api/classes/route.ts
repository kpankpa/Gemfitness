import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/classes
 * List all gym classes with optional filtering
 * Query params: status, type, limit
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as $Enums.ClassStatus | null;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: { status?: $Enums.ClassStatus; type?: string } = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const classes = await prisma.class.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { 
            bookings: true,
            waitlist: {
              where: { status: 'waiting' }
            },
            reviews: {
              where: { status: 'published' }
            }
          }
        },
        reviews: {
          where: { status: 'published' },
          select: { rating: true }
        }
      }
    });

    const formattedClasses = classes.map(c => {
      // Calculate average rating
      const totalRating = c.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = c.reviews.length > 0 ? totalRating / c.reviews.length : null;

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        instructor: c.instructor,
        duration: c.duration,
        maxCapacity: c.maxCapacity,
        currentBookings: c.currentBookings,
        enrolled: c._count.bookings,
        schedule: c.schedule,
        color: c.color,
        status: c.status,
        rating: averageRating,
        waitlistCount: c._count.waitlist,
        totalReviews: c._count.reviews,
        createdBy: c.createdBy,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
      total: formattedClasses.length
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes
 * Create a new gym class
 * Requires MANAGER or ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can create classes
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      instructor,
      duration,
      maxCapacity,
      schedule,
      color,
      status
    } = body;

    // Validation
    if (!name || !type || !instructor || !duration || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, instructor, duration, schedule' },
        { status: 400 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description: description || null,
        type,
        instructor,
        duration: parseInt(duration),
        maxCapacity: maxCapacity ? parseInt(maxCapacity) : 20,
        schedule,
        color: color || null,
        status: status || $Enums.ClassStatus.ACTIVE,
        createdBy: session.userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Class created successfully',
      class: {
        id: newClass.id,
        name: newClass.name,
        description: newClass.description,
        type: newClass.type,
        instructor: newClass.instructor,
        duration: newClass.duration,
        maxCapacity: newClass.maxCapacity,
        schedule: newClass.schedule,
        color: newClass.color,
        status: newClass.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
