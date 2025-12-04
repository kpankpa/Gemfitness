import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  const startTime = Date.now();
  console.log('📊 [ANALYTICS] Request started');

  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
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
    console.log(`  ✓ Today's check-ins: ${todayCheckIns} (${Date.now() - startTime}ms)`);

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

    // Query 6: Recent payments (last 5)
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

    // Calculate attendance rate
    const attendanceRate = activeMembers > 0
      ? `${Math.round((todayCheckIns / activeMembers) * 100)}%`
      : '0%';

    const response = {
      success: true,
      totalMembers,
      activeMembers,
      expiringSoon,
      todayCheckIns,
      monthlyRevenue,
      recentPayments,
      attendanceRate,
      weeklyCheckIns: [], // TODO: Implement weekly chart data
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
