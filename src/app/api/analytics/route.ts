/**
 * DASHBOARD ANALYTICS API
 * 
 * Endpoints:
 * - GET /api/analytics - Get dashboard statistics and recent data
 * 
 * Used by: Admin Dashboard (Overview tab)
 * Purpose: Real-time stats, revenue, member counts, recent payments
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/analytics - Get dashboard analytics
export async function GET() {
  try {
    logger.info('Fetching analytics data');

    // Get counts
    const totalMembers = await prisma.user.count({
      where: { role: 'MEMBER' }
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: { 
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });

    // Calculate today's date range (use UTC midnight to avoid timezone issues)
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get revenue for this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        paymentDate: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    // Get expiring soon (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringSoon = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: threeDaysFromNow
        }
      }
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: {
        subscription: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10
    });

    const formattedPayments = recentPayments.map(payment => ({
      id: payment.id,
      member: `${payment.subscription.user.firstName} ${payment.subscription.user.lastName}`,
      amount: payment.amount,
      plan: payment.subscription.plan.replace(/_/g, ' '),
      date: payment.paymentDate.toISOString().split('T')[0],
      reference: payment.reference
    }));

    // Calculate attendance rate (members who checked in today / total active members)
    const attendanceRate = activeSubscriptions > 0 
      ? Math.round((todayCheckIns / activeSubscriptions) * 100) 
      : 0;

    // Get this week's check-ins for trends
    const startOfWeek = new Date(today);
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: { gte: startOfWeek }
      }
    });

    // Calculate average daily check-ins this week
    const daysIntoWeek = Math.ceil((today.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const avgDailyCheckIns = Math.round(weekCheckIns / daysIntoWeek);

    const analyticsData = {
      totalMembers,
      activeMembers: activeSubscriptions,
      todayCheckIns,
      monthlyRevenue: monthlyRevenue._sum?.amount || 0,
      expiringSoon,
      recentPayments: formattedPayments,
      attendanceRate: `${attendanceRate}%`,
      weeklyCheckIns: weekCheckIns,
      avgDailyCheckIns: avgDailyCheckIns
    };

    logger.info('Analytics data fetched successfully', analyticsData);

    return NextResponse.json(analyticsData);

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}