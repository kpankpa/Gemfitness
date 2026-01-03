/**
 * PLAN ANALYTICS API
 * 
 * Endpoint: GET /api/plans/analytics
 * 
 * Provides comprehensive analytics for membership plans:
 * - Total revenue (MRR, ARR)
 * - Active subscriptions count
 * - New subscriptions (7 days, 30 days)
 * - Expiring subscriptions (30 days)
 * - Churn rate
 * - Revenue breakdown by plan
 * - Top performing plan
 * - Renewal statistics
 * 
 * Used by: Admin Dashboard (Plans tab analytics cards)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { $Enums } from '@prisma/client';

export async function GET() {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      select: {
        plan: true,
        amount: true,
        startDate: true,
        endDate: true,
      },
    });

    // Get new subscriptions (last 7 days)
    const newSubscriptionsLast7Days = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        startDate: { gte: sevenDaysAgo },
      },
    });

    // Get new subscriptions (last 30 days)
    const newSubscriptionsLast30Days = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        startDate: { gte: thirtyDaysAgo },
      },
    });

    // Get expiring subscriptions (next 30 days)
    const expiringSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    // Get expired/cancelled subscriptions (last 30 days for churn calculation)
    const churnedSubscriptions = await prisma.subscription.count({
      where: {
        OR: [
          { status: 'EXPIRED' },
          { status: 'CANCELLED' },
        ],
        updatedAt: { gte: thirtyDaysAgo },
      },
    });

    // Calculate total revenue
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

    // Calculate MRR (Monthly Recurring Revenue) - average monthly value
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      // Convert all plans to monthly equivalent
      const start = new Date(sub.startDate);
      const end = new Date(sub.endDate);
      const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyValue = (sub.amount / durationDays) * 30;
      return sum + monthlyValue;
    }, 0);

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate churn rate (% of subscriptions lost in last 30 days)
    const totalSubscriptionsThirtyDaysAgo = activeSubscriptions.length + churnedSubscriptions;
    const churnRate = totalSubscriptionsThirtyDaysAgo > 0 
      ? (churnedSubscriptions / totalSubscriptionsThirtyDaysAgo) * 100 
      : 0;

    // Revenue breakdown by plan
    const revenueByPlan: Record<string, { revenue: number; count: number }> = {};
    activeSubscriptions.forEach((sub) => {
      if (!revenueByPlan[sub.plan]) {
        revenueByPlan[sub.plan] = { revenue: 0, count: 0 };
      }
      revenueByPlan[sub.plan].revenue += sub.amount;
      revenueByPlan[sub.plan].count += 1;
    });

    // Convert to array and calculate percentages
    const revenueBreakdown = Object.entries(revenueByPlan).map(([plan, data]) => ({
      plan,
      revenue: data.revenue,
      count: data.count,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Find top performing plan
    const topPerformingPlan = revenueBreakdown[0]?.plan || 'N/A';

    // Get plan details for enhanced metrics
    const planMetrics = await Promise.all(
      revenueBreakdown.map(async (item) => {
        // Count new subscriptions for this plan (7 days, 30 days)
        const newLast7Days = await prisma.subscription.count({
          where: {
            plan: item.plan as unknown as $Enums.MembershipPlan,
            status: 'ACTIVE',
            startDate: { gte: sevenDaysAgo },
          },
        });

        const newLast30Days = await prisma.subscription.count({
          where: {
            plan: item.plan as unknown as $Enums.MembershipPlan,
            status: 'ACTIVE',
            startDate: { gte: thirtyDaysAgo },
          },
        });

        // Count expiring soon for this plan
        const expiringSoon = await prisma.subscription.count({
          where: {
            plan: item.plan as unknown as $Enums.MembershipPlan,
            status: 'ACTIVE',
            endDate: {
              gte: now,
              lte: thirtyDaysFromNow,
            },
          },
        });

        // Calculate renewal rate (subscribers who renewed in last 30 days)
        const renewals = await prisma.subscription.count({
          where: {
            plan: item.plan as unknown as $Enums.MembershipPlan,
            startDate: { gte: thirtyDaysAgo },
            userId: {
              in: (await prisma.subscription.findMany({
                where: {
                  plan: item.plan as unknown as $Enums.MembershipPlan,
                  endDate: { lte: now, gte: thirtyDaysAgo },
                },
                select: { userId: true },
              })).map(s => s.userId),
            },
          },
        });

        const eligibleForRenewal = await prisma.subscription.count({
          where: {
            plan: item.plan as unknown as $Enums.MembershipPlan,
            endDate: { lte: now, gte: thirtyDaysAgo },
          },
        });

        const renewalRate = eligibleForRenewal > 0 ? (renewals / eligibleForRenewal) * 100 : 0;

        return {
          plan: item.plan,
          newSubscriptions7Days: newLast7Days,
          newSubscriptions30Days: newLast30Days,
          expiringSoon,
          renewalRate: Math.round(renewalRate * 10) / 10,
        };
      })
    );

    return NextResponse.json({
      success: true,
      analytics: {
        totalActivePlans: await prisma.plan.count({ where: { status: 'ACTIVE' } }),
        totalActiveSubscriptions: activeSubscriptions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
        annualRecurringRevenue: Math.round(arr * 100) / 100,
        newSubscriptionsLast7Days,
        newSubscriptionsLast30Days,
        expiringInNext30Days: expiringSubscriptions,
        churnRate: Math.round(churnRate * 10) / 10,
        topPerformingPlan,
        revenueBreakdown,
        planMetrics,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching plan analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan analytics' },
      { status: 500 }
    );
  }
}
