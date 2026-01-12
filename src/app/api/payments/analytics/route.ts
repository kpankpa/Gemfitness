// Enhanced Payment Analytics API
// src/app/api/payments/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    // Verify admin/manager access
    const session = await verifySessionForApi();
    if (!session.isAuth || !['ADMIN', 'MANAGER'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Revenue by payment method
    const paymentMethodBreakdown = await prisma.paymentTransaction.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'success',
        paidAt: { gte: startDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Monthly recurring revenue calculation
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    const mrr = activeSubscriptions.reduce((total, sub) => {
      const monthlyValue = sub.plan === 'ONE_MONTH' ? sub.amount : 
                          sub.plan === 'THREE_MONTHS' ? sub.amount / 3 : 
                          sub.amount / 12;
      return total + monthlyValue;
    }, 0);

    // Payment success rates
    const paymentStats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      where: { paidAt: { gte: startDate } },
      _count: { id: true }
    });

    const totalPayments = paymentStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const successfulPayments = paymentStats.find(s => s.status === 'success')?._count.id || 0;
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // Revenue trends (last 12 months)
    const revenueTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "paidAt") as month,
        SUM("amount") as revenue,
        COUNT(*) as transactions
      FROM "payment_transactions" 
      WHERE "status" = 'success' 
        AND "paidAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY month DESC
    `;

    // Outstanding payments
    const outstandingPayments = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lte: new Date() } // Expired but still active
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { paymentDate: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      analytics: {
        paymentMethodBreakdown: paymentMethodBreakdown.map(method => ({
          method: method.paymentMethod,
          revenue: method._sum.amount || 0,
          transactions: method._count.id,
          percentage: ((method._sum.amount || 0) / paymentMethodBreakdown.reduce((sum, m) => sum + (m._sum.amount || 0), 0)) * 100
        })),
        monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
        annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
        paymentSuccessRate: Math.round(successRate * 100) / 100,
        totalRevenue: paymentMethodBreakdown.reduce((sum, m) => sum + (m._sum.amount || 0), 0),
        revenueTrends,
        outstandingPayments: outstandingPayments.length,
        outstandingAmount: outstandingPayments.reduce((sum, sub) => {
          const planAmount = sub.plan === 'ONE_MONTH' ? 200 : 
                           sub.plan === 'THREE_MONTHS' ? 500 : 2200;
          return sum + planAmount;
        }, 0)
      }
    });

  } catch (error) {
    console.error('Payment analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment analytics' },
      { status: 500 }
    );
  }
}