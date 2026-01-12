import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// GET /api/members/[id]/class-history - Get member's class history
export async function GET(
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

    const { id: memberId } = await params;

    // Check if user can view this history (self or staff)
    if (
      session.userId !== memberId &&
      session.role !== 'ADMIN' &&
      session.role !== 'MANAGER' &&
      session.role !== 'RECEPTIONIST'
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this history' },
        { status: 403 }
      );
    }

    // Get all class bookings
    const bookings = await prisma.classBooking.findMany({
      where: {
        userId: memberId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            type: true,
            instructor: true,
            duration: true,
            schedule: true,
          },
        },
      },
      orderBy: {
        bookedFor: 'desc',
      },
    });

    // Calculate attendance stats
    const totalBookings = bookings.length;
    const attendedCount = bookings.filter((b) => b.status === 'attended').length;
    const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
    const attendanceRate =
      totalBookings > 0 ? Math.round((attendedCount / totalBookings) * 100) : 0;

    // Find favorite classes (most attended)
    const classAttendance: Record<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { classData: any; count: number }
    > = {};

    bookings.forEach((booking) => {
      if (booking.status === 'attended') {
        const classId = booking.classId;
        if (!classAttendance[classId]) {
          classAttendance[classId] = {
            classData: booking.class,
            count: 0,
          };
        }
        classAttendance[classId].count++;
      }
    });

    const favoriteClasses = Object.values(classAttendance)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        class: item.classData,
        attendedCount: item.count,
      }));

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = bookings.filter(
      (b) => new Date(b.bookedFor) >= thirtyDaysAgo
    );

    return NextResponse.json({
      success: true,
      history: {
        totalBookings,
        attendedCount,
        cancelledCount,
        confirmedCount: totalBookings - attendedCount - cancelledCount,
        attendanceRate,
        favoriteClasses,
        recentActivity: recentBookings.length,
        bookings: bookings.map((b) => ({
          id: b.id,
          class: b.class,
          bookedFor: b.bookedFor,
          status: b.status,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching class history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch class history' },
      { status: 500 }
    );
  }
}
