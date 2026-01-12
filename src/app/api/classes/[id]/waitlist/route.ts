import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// GET /api/classes/[id]/waitlist - Get waitlist for a class
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;

    // Get waitlist entries with user details
    const waitlist = await prisma.waitlist.findMany({
      where: {
        classId,
        status: 'waiting',
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
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      waitlist: waitlist.map((entry: any) => ({
        id: entry.id,
        position: entry.position,
        status: entry.status,
        joinedAt: entry.createdAt,
        user: entry.user,
      })),
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/waitlist - Join waitlist
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;
    const userId = session.userId;

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if class is full
    if (classData._count.bookings < classData.maxCapacity) {
      return NextResponse.json(
        { success: false, error: 'Class has available spots. Please book directly.' },
        { status: 400 }
      );
    }

    // Check if user already enrolled
    const existingBooking = await prisma.classBooking.findFirst({
      where: {
        userId: userId!,
        classId,
        status: 'confirmed',
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'You are already enrolled in this class' },
        { status: 400 }
      );
    }

    // Check if already on waitlist
    const existingWaitlist = await prisma.waitlist.findUnique({
      where: {
        userId_classId: {
          userId: userId!,
          classId,
        },
      },
    });

    if (existingWaitlist) {
      return NextResponse.json(
        { success: false, error: 'You are already on the waitlist' },
        { status: 400 }
      );
    }

    // Get next position in waitlist
    const lastPosition = await prisma.waitlist.findFirst({
      where: { classId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = (lastPosition?.position || 0) + 1;

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        userId: userId!,
        classId,
        position: newPosition,
        status: 'waiting',
      },
      include: {
        class: {
          select: {
            name: true,
            instructor: true,
            schedule: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Added to waitlist successfully',
      position: newPosition,
      waitlistEntry,
    });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id]/waitlist - Leave waitlist
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;
    const userId = session.userId;

    // Find and delete waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: {
        userId_classId: {
          userId: userId!,
          classId,
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { success: false, error: 'Not on waitlist' },
        { status: 404 }
      );
    }

    // Delete entry
    await prisma.waitlist.delete({
      where: {
        id: waitlistEntry.id,
      },
    });

    // Reorder remaining waitlist positions
    await prisma.waitlist.updateMany({
      where: {
        classId,
        position: { gt: waitlistEntry.position },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Removed from waitlist successfully',
    });
  } catch (error) {
    console.error('Error leaving waitlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to leave waitlist' },
      { status: 500 }
    );
  }
}
