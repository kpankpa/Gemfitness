import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { sendClassBookingConfirmation } from '@/lib/services/email/mock';

/**
 * POST /api/classes/[id]/claim - Claim waitlist spot (2-hour window)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;
    const { waitlistId } = await request.json();
    const userId = session.userId!;

    if (!waitlistId) {
      return NextResponse.json(
        { success: false, error: 'Waitlist ID required' },
        { status: 400 }
      );
    }

    // Find and validate waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            instructor: true,
            schedule: true,
            maxCapacity: true,
            isFree: true,
            price: true,
            _count: {
              select: {
                bookings: {
                  where: {
                    status: 'confirmed',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!waitlistEntry) {
      return NextResponse.json(
        { success: false, error: 'Waitlist entry not found' },
        { status: 404 }
      );
    }

    // Verify user owns this waitlist entry
    if (waitlistEntry.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'This waitlist spot does not belong to you' },
        { status: 403 }
      );
    }

    // Check if entry is in 'notified' status
    if (waitlistEntry.status !== 'notified') {
      return NextResponse.json(
        { success: false, error: 'This waitlist entry is not available for claiming' },
        { status: 400 }
      );
    }

    // Check if claim window has expired
    const now = new Date();
    if (waitlistEntry.expiresAt && waitlistEntry.expiresAt < now) {
      // Mark as expired
      await prisma.waitlist.update({
        where: { id: waitlistId },
        data: { status: 'expired' },
      });

      return NextResponse.json(
        { success: false, error: 'Claim window has expired (2 hours)' },
        { status: 410 } // 410 Gone
      );
    }

    // Check if class still has capacity
    const currentBookings = waitlistEntry.class._count.bookings;
    if (currentBookings >= waitlistEntry.class.maxCapacity) {
      return NextResponse.json(
        { success: false, error: 'Class is now full' },
        { status: 400 }
      );
    }

    // Get the schedule date for bookedFor
    const classScheduleDate = new Date(waitlistEntry.class.schedule);

    // Create booking and update waitlist in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the booking
      const booking = await tx.classBooking.create({
        data: {
          userId: userId,
          classId: classId,
          bookedFor: classScheduleDate,
          status: 'confirmed',
        },
        include: {
          class: true,
          user: true,
        },
      });

      // Update waitlist entry to 'enrolled'
      await tx.waitlist.update({
        where: { id: waitlistId },
        data: { 
          status: 'enrolled',
        },
      });

      return booking;
    });

    // Send confirmation email
    await sendClassBookingConfirmation(
      waitlistEntry.user.email,
      waitlistEntry.user.firstName,
      {
        className: waitlistEntry.class.name,
        instructor: waitlistEntry.class.instructor,
        schedule: waitlistEntry.class.schedule,
        bookedFor: result.bookedFor.toISOString(),
        isFree: waitlistEntry.class.isFree,
        ...(waitlistEntry.class.price !== null && { price: waitlistEntry.class.price }),
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Spot claimed successfully! You are now enrolled.',
      booking: {
        id: result.id,
        classId: result.classId,
        className: waitlistEntry.class.name,
        instructor: waitlistEntry.class.instructor,
        schedule: waitlistEntry.class.schedule,
        bookedFor: result.bookedFor,
        status: result.status,
      },
    });

  } catch (error) {
    console.error('Error claiming waitlist spot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim spot' },
      { status: 500 }
    );
  }
}
