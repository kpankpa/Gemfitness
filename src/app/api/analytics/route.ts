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
        expiresAt: { gte: new Date() }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await prisma.checkIn.count({
      where: {
        checkedInAt: {
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
        paidAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    // Get expiring soon (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringSoon = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(),
          lte: threeDaysFromNow
        }
      }
    });

    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { paidAt: 'desc' },
      take: 10
    });

    const formattedPayments = recentPayments.map(payment => ({
      id: payment.id,
      member: payment.user.name,
      amount: payment.amount,
      plan: payment.plan?.replace(/_/g, ' ') || 'Registration',
      date: payment.paidAt?.toISOString().split('T')[0] || 'N/A',
      reference: payment.reference
    }));

    return NextResponse.json({
      stats: {
        totalMembers,
        activeMembers: activeSubscriptions,
        todayCheckIns,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
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