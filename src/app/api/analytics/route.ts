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

// GET /api/analytics - Get dashboard analytics
export async function GET() {
  try {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers: activeSubscriptions,
        todayCheckIns,
        monthlyRevenue: monthlyRevenue._sum?.amount || 0,
        expiringSoon
      },
      recentPayments: formattedPayments
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}