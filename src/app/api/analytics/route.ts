import { NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  const startTime = Date.now();
  console.log('📊 [ANALYTICS] Request started');

  try {
    // Verify authentication (per-request)
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      console.log('❌ [ANALYTICS] Unauthorized - no session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`✅ [ANALYTICS] Session valid - Role: ${session.role} (${Date.now() - startTime}ms)`);

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('🔍 [ANALYTICS] Starting database queries...');

    // Query 1: Total members count
    console.log('  → Counting total members...');
    const totalMembers = await prisma.user.count({
      where: { role: $Enums.UserRole.MEMBER }
    });
    console.log(`  ✓ Total members: ${totalMembers} (${Date.now() - startTime}ms)`);

    // Query 2: Active subscriptions count
    console.log('  → Counting active subscriptions...');
    const activeMembers = await prisma.subscription.count({
      where: {
        status: $Enums.SubscriptionStatus.ACTIVE,
        endDate: { gte: now }
      }
    });
    console.log(`  ✓ Active subscriptions: ${activeMembers} (${Date.now() - startTime}ms)`);

    // Query 3: Today's check-ins count
    console.log('  → Counting today\'s check-ins...');
    const todayCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: { gte: todayStart }
      }
    });
    console.log(`  ✓ Today's check-ins: ${todayCheckIns} (${Date.now() - startTime}ms`);

    // Query 3.5: Day passes sold today
    console.log('  → Counting day passes sold today...');
    const dayPassesToday = await prisma.subscription.count({
      where: {
        plan: 'DAILY',
        startDate: { gte: todayStart }
      }
    });
    console.log(`  ✓ Day passes today: ${dayPassesToday} (${Date.now() - startTime}ms)`);

    // Query 4: Subscriptions expiring within 7 days
    console.log('  → Counting expiring subscriptions...');
    const expiringSoon = await prisma.subscription.count({
      where: {
        status: $Enums.SubscriptionStatus.ACTIVE,
        endDate: {
          gte: now,
          lte: weekFromNow
        }
      }
    });
    console.log(`  ✓ Expiring soon: ${expiringSoon} (${Date.now() - startTime}ms)`);

    // Query 5: Monthly revenue from successful payments
    console.log('  → Calculating monthly revenue...');
    const monthlyPayments = await prisma.payment.aggregate({
      where: {
        status: $Enums.PaymentStatus.SUCCESS,
        paymentDate: { gte: monthStart }
      },
      _sum: {
        amount: true
      }
    });
    const monthlyRevenue = monthlyPayments._sum.amount || 0;
    console.log(`  ✓ Monthly revenue: GH₵${monthlyRevenue} (${Date.now() - startTime}ms)`);

    // Query 6: Monthly transaction count
    console.log('  → Counting monthly transactions...');
    const monthlyTransactions = await prisma.payment.count({
      where: {
        status: $Enums.PaymentStatus.SUCCESS,
        paymentDate: { gte: monthStart }
      }
    });
    console.log(`  ✓ Monthly transactions: ${monthlyTransactions} (${Date.now() - startTime}ms)`);

    // Query 7: Recent payments (last 5)
    console.log('  → Fetching recent payments...');
    const recentPaymentsData = await prisma.payment.findMany({
      where: {
        status: $Enums.PaymentStatus.SUCCESS
      },
      orderBy: {
        paymentDate: 'desc'
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        subscription: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    const recentPayments = recentPaymentsData.map(payment => ({
      id: payment.id,
      member: `${payment.subscription.user.firstName} ${payment.subscription.user.lastName}`,
      amount: payment.amount,
      date: payment.paymentDate.toISOString()
    }));
    console.log(`  ✓ Recent payments: ${recentPayments.length} records (${Date.now() - startTime}ms)`);

    // Query 8: Last month's revenue for growth calculation
    console.log('  → Calculating last month revenue...');
    const lastMonthPayments = await prisma.payment.aggregate({
      where: {
        status: $Enums.PaymentStatus.SUCCESS,
        paymentDate: { gte: lastMonthStart, lte: lastMonthEnd }
      },
      _sum: { amount: true }
    });
    const lastMonthRevenue = lastMonthPayments._sum.amount || 0;
    console.log(`  ✓ Last month revenue: GH₵${lastMonthRevenue} (${Date.now() - startTime}ms)`);

    // Query 9: Calculate 30-day average check-ins
    console.log('  → Calculating 30-day check-in average...');
    const thirtyDayCheckIns = await prisma.checkIn.count({
      where: { checkInTime: { gte: thirtyDaysAgo } }
    });
    const avgCheckInsPerDay = Math.round(thirtyDayCheckIns / 30);
    console.log(`  ✓ 30-day avg check-ins: ${avgCheckInsPerDay}/day (${Date.now() - startTime}ms)`);

    // Query 10: Weekly check-ins for chart (last 7 days)
    console.log('  → Fetching weekly check-in data...');
    const weeklyCheckInsData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const count = await prisma.checkIn.count({
        where: { checkInTime: { gte: dayStart, lte: dayEnd } }
      });
      
      weeklyCheckInsData.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        count
      });
    }
    console.log(`  ✓ Weekly check-ins data: ${weeklyCheckInsData.length} days (${Date.now() - startTime}ms)`);

    // Query 11: Calculate retention rate (cancelled vs active)
    console.log('  → Calculating retention rate...');
    const totalSubscriptions = await prisma.subscription.count();
    const cancelledSubscriptions = await prisma.subscription.count({
      where: { status: $Enums.SubscriptionStatus.CANCELLED }
    });
    const retentionRate = totalSubscriptions > 0
      ? Math.round(((totalSubscriptions - cancelledSubscriptions) / totalSubscriptions) * 1000) / 10
      : 0;
    console.log(`  ✓ Retention rate: ${retentionRate}% (${Date.now() - startTime}ms)`);

    // Calculate metrics
    const attendanceRate = activeMembers > 0
      ? `${Math.round((todayCheckIns / activeMembers) * 100)}%`
      : '0%';
    
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : monthlyRevenue > 0 ? 100 : 0;
    
    const peakCheckIns = Math.max(...weeklyCheckInsData.map(d => d.count), 0);

    const response = {
      success: true,
      totalMembers,
      activeMembers,
      expiringSoon,
      todayCheckIns,
      dayPassesToday,
      monthlyRevenue,
      lastMonthRevenue,
      monthlyTransactions,
      recentPayments,
      attendanceRate,
      revenueGrowth,
      retentionRate,
      avgCheckInsPerDay,
      peakCheckIns,
      weeklyCheckIns: weeklyCheckInsData,
      expiringThisWeek: expiringSoon
    };

    console.log(`✅ [ANALYTICS] Completed successfully (${Date.now() - startTime}ms)`);
    return NextResponse.json(response);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [ANALYTICS] Error after ${elapsed}ms:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics'
      },
      { status: 500 }
    );
  }
}
