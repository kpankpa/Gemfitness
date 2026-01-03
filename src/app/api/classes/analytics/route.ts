import { NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/classes/analytics
 * Get comprehensive analytics for all classes
 */
export async function GET() {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff can view analytics
    if (!['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ 
        error: 'Forbidden - Staff access required' 
      }, { status: 403 });
    }

    // Get all classes with enrollment data
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { bookings: true }
        },
        bookings: {
          where: {
            status: {
              in: ['confirmed', 'attended']
            }
          },
          include: {
            user: true
          }
        }
      }
    });

    // Calculate overall stats
    const totalClasses = classes.length;
    const activeClasses = classes.filter(c => c.status === 'ACTIVE').length;
    const totalEnrollments = classes.reduce((sum, c) => sum + c._count.bookings, 0);
    const averageEnrollment = totalClasses > 0 ? Math.round(totalEnrollments / totalClasses) : 0;
    
    // Calculate capacity utilization
    const totalCapacity = classes.reduce((sum, c) => sum + c.maxCapacity, 0);
    const capacityUtilization = totalCapacity > 0 
      ? Math.round((totalEnrollments / totalCapacity) * 100) 
      : 0;

    // Most popular classes
    const popularClasses = classes
      .map(c => ({
        id: c.id,
        name: c.name,
        instructor: c.instructor,
        enrolled: c._count.bookings,
        capacity: c.maxCapacity,
        utilization: Math.round((c._count.bookings / c.maxCapacity) * 100)
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 5);

    // Classes by type
    const classesByType = classes.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Enrollment trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEnrollments = await prisma.classBooking.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalClasses,
        activeClasses,
        totalEnrollments,
        averageEnrollment,
        totalCapacity,
        capacityUtilization
      },
      popularClasses,
      classesByType,
      recentEnrollments: recentEnrollments.length,
      trend: {
        last7Days: recentEnrollments.filter(e => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return new Date(e.createdAt) >= sevenDaysAgo;
        }).length,
        last30Days: recentEnrollments.length
      }
    });
  } catch (error) {
    console.error('Error fetching class analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
