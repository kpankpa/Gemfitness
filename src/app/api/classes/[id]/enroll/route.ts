import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/classes/[id]/enroll
 * Enroll a member in a class
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

    const { id: classId } = await params;
    const body = await request.json();
    const { userId, bookedFor } = body;

    // Use session userId if not provided (member enrolling themselves)
    const targetUserId = userId || session.userId;

    // Check if class exists and is active
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Class is not active' }, { status: 400 });
    }

    // Check capacity
    if (classData._count.bookings >= classData.maxCapacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 });
    }

    // Check if already enrolled
    const existingBooking = await prisma.classBooking.findFirst({
      where: {
        userId: targetUserId,
        classId: classId,
        status: 'confirmed'
      }
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 });
    }

    // Create booking
    const booking = await prisma.classBooking.create({
      data: {
        userId: targetUserId,
        classId: classId,
        bookedFor: bookedFor ? new Date(bookedFor) : new Date(),
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {
          select: {
            name: true,
            schedule: true
          }
        }
      }
    });

    // Update class current bookings count
    await prisma.class.update({
      where: { id: classId },
      data: {
        currentBookings: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in class',
      booking: {
        id: booking.id,
        userName: `${booking.user.firstName} ${booking.user.lastName}`,
        className: booking.class.name,
        schedule: booking.class.schedule,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error enrolling in class:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]/enroll
 * Unenroll from a class
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

    const { id: classId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Only allow unenrolling yourself or if you're staff
    if (userId !== session.userId && !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and cancel booking
    const booking = await prisma.classBooking.findFirst({
      where: {
        userId: userId,
        classId: classId,
        status: 'confirmed'
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'No active enrollment found' }, { status: 404 });
    }

    // Update booking status
    await prisma.classBooking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });

    // Decrement class bookings count
    await prisma.class.update({
      where: { id: classId },
      data: {
        currentBookings: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from class'
    });
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    return NextResponse.json(
      { error: 'Failed to unenroll from class' },
      { status: 500 }
    );
  }
}
