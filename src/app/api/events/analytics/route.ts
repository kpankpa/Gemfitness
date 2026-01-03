import { NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/analytics
 * Get comprehensive analytics for all events
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

    // Get all events with registration data
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { 
            bookings: {
              where: { status: 'registered' }
            }
          }
        },
        bookings: {
          where: { status: 'registered' },
          include: {
            user: {
              select: {
                subscriptions: {
                  where: { status: 'ACTIVE' },
                  select: { plan: true }
                }
              }
            }
          }
        }
      }
    });

    // Calculate overall stats
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.status === 'UPCOMING').length;
    const ongoingEvents = events.filter(e => e.status === 'ONGOING').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    
    const totalRegistrations = events.reduce((sum, e) => sum + e._count.bookings, 0);
    const averageRegistration = totalEvents > 0 
      ? Math.round(totalRegistrations / totalEvents) 
      : 0;

    // Revenue calculation
    const totalRevenue = events.reduce((sum, e) => {
      if (!e.isFree && e.price) {
        return sum + (e._count.bookings * e.price);
      }
      return sum;
    }, 0);

    const paidEvents = events.filter(e => !e.isFree).length;
    const freeEvents = events.filter(e => e.isFree).length;

    // Member vs Non-member breakdown
    let memberRegistrations = 0;
    let nonMemberRegistrations = 0;

    events.forEach(event => {
      event.bookings.forEach(booking => {
        if (booking.user.subscriptions.length > 0) {
          memberRegistrations++;
        } else {
          nonMemberRegistrations++;
        }
      });
    });

    // Most popular events
    const popularEvents = events
      .filter(e => e.status !== 'CANCELLED')
      .map(e => ({
        id: e.id,
        title: e.title,
        eventDate: e.eventDate.toISOString(),
        registered: e._count.bookings,
        maxAttendees: e.maxAttendees,
        utilization: e.maxAttendees 
          ? Math.round((e._count.bookings / e.maxAttendees) * 100) 
          : null,
        revenue: e.isFree ? 0 : (e._count.bookings * (e.price || 0))
      }))
      .sort((a, b) => b.registered - a.registered)
      .slice(0, 5);

    // Registration trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await prisma.eventBooking.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: 'registered'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        completedEvents,
        totalRegistrations,
        averageRegistration,
        totalRevenue,
        paidEvents,
        freeEvents
      },
      demographics: {
        memberRegistrations,
        nonMemberRegistrations,
        memberPercentage: totalRegistrations > 0 
          ? Math.round((memberRegistrations / totalRegistrations) * 100) 
          : 0
      },
      popularEvents,
      recentRegistrations: recentRegistrations.length,
      trend: {
        last7Days: recentRegistrations.filter(r => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return new Date(r.createdAt) >= sevenDaysAgo;
        }).length,
        last30Days: recentRegistrations.length
      }
    });
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
