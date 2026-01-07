import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view reports
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // First day of month
    const end = endDate ? new Date(endDate) : new Date(); // Today

    logger.info(`Generating ${reportType} report from ${start} to ${end}`);

    switch (reportType) {
      case 'revenue':
        return await getRevenueReport(start, end);
      
      case 'attendance':
        return await getAttendanceReport(start, end);
      
      case 'member-growth':
        return await getMemberGrowthReport(start, end);
      
      case 'class-performance':
        return await getClassPerformanceReport(start, end);
      
      case 'overview':
        return await getOverviewReport(start, end);
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function getRevenueReport(startDate: Date, endDate: Date) {
  try {
    // Get all subscriptions within date range
    const subscriptions = await prisma.subscription.findMany({
      where: {
        startDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Get all payments within date range
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'SUCCESS'
      },
      include: {
        subscription: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Calculate metrics
    const totalRevenue = payments.reduce((sum: number, pay) => sum + pay.amount, 0);
    const subscriptionRevenue = payments.reduce((sum: number, pay) => sum + pay.amount, 0);

    // Revenue by plan
    const revenueByPlan = subscriptions.reduce((acc: Record<string, number>, sub) => {
      const planName = sub.plan;
      acc[planName] = (acc[planName] || 0) + sub.amount;
      return acc;
    }, {});

    // Daily revenue breakdown
    const dailyRevenue = payments.reduce((acc: Record<string, number>, payment) => {
      const date = new Date(payment.paymentDate).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {});

    const report = {
      summary: {
        totalRevenue,
        subscriptionRevenue,
        registrationRevenue: 0, // Can be calculated from paymentTransactions if needed
        totalTransactions: payments.length,
        averageTransactionValue: payments.length > 0 ? totalRevenue / payments.length : 0
      },
      breakdown: {
        byPlan: Object.entries(revenueByPlan).map(([plan, revenue]) => ({
          plan,
          revenue,
          percentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(2) : '0'
        })),
        daily: Object.entries(dailyRevenue)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, revenue]) => ({ date, revenue }))
      },
      transactions: payments.map(pay => ({
        date: pay.paymentDate,
        member: `${pay.subscription.user.firstName} ${pay.subscription.user.lastName}`,
        email: pay.subscription.user.email,
        type: 'Subscription',
        plan: pay.subscription.plan,
        amount: pay.amount,
        status: pay.status
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error in revenue report:', error);
    throw error;
  }
}

async function getAttendanceReport(startDate: Date, endDate: Date) {
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        checkInTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        checkInTime: 'desc'
      }
    });

    // Calculate metrics
    const totalCheckIns = checkIns.length;
    const uniqueMembers = new Set(checkIns.map(c => c.userId)).size;
    const averagePerDay = totalCheckIns / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Check-ins by member
    interface MemberCheckIn {
      memberId: string;
      memberName: string;
      email: string;
      count: number;
      lastCheckIn: Date;
    }
    
    const memberCheckIns = checkIns.reduce((acc: Record<string, MemberCheckIn>, checkIn) => {
      const key = checkIn.userId;
      if (!acc[key]) {
        acc[key] = {
          memberId: checkIn.userId,
          memberName: `${checkIn.user.firstName} ${checkIn.user.lastName}`,
          email: checkIn.user.email,
          count: 0,
          lastCheckIn: checkIn.checkInTime
        };
      }
      acc[key].count++;
      if (new Date(checkIn.checkInTime) > new Date(acc[key].lastCheckIn)) {
        acc[key].lastCheckIn = checkIn.checkInTime;
      }
      return acc;
    }, {});

    // Daily attendance
    const dailyAttendance = checkIns.reduce((acc: Record<string, number>, checkIn) => {
      const date = new Date(checkIn.checkInTime).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Hourly distribution
    const hourlyDistribution = checkIns.reduce((acc: Record<number, number>, checkIn) => {
      const hour = new Date(checkIn.checkInTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const report = {
      summary: {
        totalCheckIns,
        uniqueMembers,
        averagePerDay: Math.round(averagePerDay * 10) / 10,
        peakDay: Object.entries(dailyAttendance).sort((a, b) => b[1] - a[1])[0]
      },
      breakdown: {
        byMember: Object.values(memberCheckIns).sort((a, b) => b.count - a.count),
        daily: Object.entries(dailyAttendance)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({ date, count })),
        hourly: Object.entries(hourlyDistribution)
          .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
          .map(([hour, count]) => ({ 
            hour: `${hour}:00`, 
            count 
          }))
      },
      recentCheckIns: checkIns.slice(0, 50).map(c => ({
        date: c.checkInTime,
        member: `${c.user.firstName} ${c.user.lastName}`,
        email: c.user.email,
        method: c.method
      }))
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error in attendance report:', error);
    throw error;
  }
}

async function getMemberGrowthReport(startDate: Date, endDate: Date) {
  try {
    const members = await prisma.user.findMany({
      where: {
        role: 'MEMBER',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        subscriptions: {
          where: {
            status: 'ACTIVE'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total members before period
    const totalBeforePeriod = await prisma.user.count({
      where: {
        role: 'MEMBER',
        createdAt: {
          lt: startDate
        }
      }
    });

    // Daily registrations
    const dailyRegistrations = members.reduce((acc: Record<string, number>, member) => {
      const date = new Date(member.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Active vs inactive
    const activeMembers = members.filter(m => m.subscriptions.length > 0).length;
    const inactiveMembers = members.length - activeMembers;

    const report = {
      summary: {
        newMembers: members.length,
        totalMembers: totalBeforePeriod + members.length,
        activeMembers,
        inactiveMembers,
        growthRate: totalBeforePeriod > 0 
          ? ((members.length / totalBeforePeriod) * 100).toFixed(2) + '%'
          : '100%'
      },
      breakdown: {
        daily: Object.entries(dailyRegistrations)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({ date, count }))
      },
      newMembers: members.map(m => ({
        date: m.createdAt,
        name: `${m.firstName} ${m.lastName}`,
        email: m.email,
        hasActiveSubscription: m.subscriptions.length > 0
      }))
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error in member growth report:', error);
    throw error;
  }
}

async function getClassPerformanceReport(startDate: Date, endDate: Date) {
  try {
    const classBookings = await prisma.classBooking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        class: {
          select: {
            name: true,
            instructor: true,
            maxCapacity: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Group by class
    interface ClassSummary {
      className: string;
      instructor: string;
      maxCapacity: number;
      totalEnrollments: number;
      attendees: Array<{ member: string; enrolledAt: Date }>;
    }
    
    const classSummary = classBookings.reduce((acc: Record<string, ClassSummary>, booking) => {
      const key = booking.class.name;
      if (!acc[key]) {
        acc[key] = {
          className: booking.class.name,
          instructor: booking.class.instructor,
          maxCapacity: booking.class.maxCapacity,
          totalEnrollments: 0,
          attendees: []
        };
      }
      acc[key].totalEnrollments++;
      acc[key].attendees.push({
        member: `${booking.user.firstName} ${booking.user.lastName}`,
        enrolledAt: booking.createdAt
      });
      return acc;
    }, {});

    const report = {
      summary: {
        totalEnrollments: classBookings.length,
        totalClasses: Object.keys(classSummary).length,
        averageEnrollmentPerClass: Object.keys(classSummary).length > 0
          ? Math.round((classBookings.length / Object.keys(classSummary).length) * 10) / 10
          : 0
      },
      classes: Object.values(classSummary).sort((a, b) => b.totalEnrollments - a.totalEnrollments)
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error in class performance report:', error);
    throw error;
  }
}

async function getOverviewReport(startDate: Date, endDate: Date) {
  try {
    // Run all reports in parallel
    const [revenue, attendance, growth, classes] = await Promise.all([
      getRevenueReport(startDate, endDate),
      getAttendanceReport(startDate, endDate),
      getMemberGrowthReport(startDate, endDate),
      getClassPerformanceReport(startDate, endDate)
    ]);

    const revenueData = await revenue.json();
    const attendanceData = await attendance.json();
    const growthData = await growth.json();
    const classData = await classes.json();

    const report = {
      period: {
        startDate,
        endDate
      },
      overview: {
        revenue: revenueData.summary,
        attendance: attendanceData.summary,
        memberGrowth: growthData.summary,
        classPerformance: classData.summary
      },
      details: {
        revenue: revenueData,
        attendance: attendanceData,
        memberGrowth: growthData,
        classPerformance: classData
      }
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error in overview report:', error);
    throw error;
  }
}
