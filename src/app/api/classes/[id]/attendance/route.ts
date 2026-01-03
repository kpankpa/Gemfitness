import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/classes/[id]/attendance
 * Get attendance for a specific class based on general check-ins
 * This correlates class enrollments with gym check-ins during class time
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

    // Only staff can view attendance
    if (!['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 });
    }

    const { id: classId } = await params;
    // const { searchParams } = new URL(request.url);
    // const date = searchParams.get('date'); // Optional: get attendance for specific date - TODO: implement date filtering

    // Get class details
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        name: true,
        schedule: true,
        instructor: true,
        duration: true
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get all enrolled members
    const enrollments = await prisma.classBooking.findMany({
      where: {
        classId: classId,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse class schedule to determine typical class times
    // Format: "Mon, Wed, Fri - 6:30 AM" or similar
    // For demo, we'll check if user checked in on the same day
    
    const attendanceData = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get recent check-ins for this user (last 30 days)
        const recentCheckIns = await prisma.checkIn.findMany({
          where: {
            userId: enrollment.userId,
            checkInTime: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: {
            checkInTime: 'desc'
          },
          take: 50
        });

        // Calculate attendance rate
        // TODO: More sophisticated matching based on class schedule times
        const totalSessions = 12; // Estimate based on class frequency (e.g., 3x/week = ~12/month)
        const attendedSessions = recentCheckIns.length; // Simplified - in reality, match to class times

        return {
          enrollmentId: enrollment.id,
          userId: enrollment.user.id,
          userName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
          email: enrollment.user.email,
          phone: enrollment.user.phone,
          profileImage: enrollment.user.profileImage,
          enrolledAt: enrollment.createdAt.toISOString(),
          totalSessions: totalSessions,
          attendedSessions: Math.min(attendedSessions, totalSessions),
          attendanceRate: Math.round((Math.min(attendedSessions, totalSessions) / totalSessions) * 100),
          lastCheckIn: recentCheckIns[0]?.checkInTime.toISOString() || null,
          status: enrollment.status
        };
      })
    );

    // Calculate overall stats
    const totalEnrolled = enrollments.length;
    const averageAttendanceRate = totalEnrolled > 0
      ? Math.round(attendanceData.reduce((sum, a) => sum + a.attendanceRate, 0) / totalEnrolled)
      : 0;

    return NextResponse.json({
      success: true,
      class: {
        id: classId,
        name: classData.name,
        schedule: classData.schedule,
        instructor: classData.instructor,
        duration: classData.duration
      },
      stats: {
        totalEnrolled,
        averageAttendanceRate,
        activeMembers: attendanceData.filter(a => a.attendanceRate >= 50).length
      },
      attendance: attendanceData
    });
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
