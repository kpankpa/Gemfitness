/**
 * List Member Subscriptions API
 * 
 * Endpoints:
 * - GET /api/subscriptions - List member's subscriptions
 * - GET /api/subscriptions/admin/all - List all subscriptions (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifySessionForApi } from '@/lib/auth/dal';

// GET /api/subscriptions - Get member's subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminAll = searchParams.get('all') === 'true';
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    // Admin can view all, otherwise only their own
    let userId: string | null = session.userId;
    if (adminAll && session.role === 'ADMIN') {
      userId = null;
    } else if (adminAll && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: Record<string, string> = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }
    if (plan) {
      where.plan = plan;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        renewalHistory: { take: 3, orderBy: { attemptedAt: 'desc' } }
      }
    });

    // Calculate additional fields
    const now = new Date();
    const enrichedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      daysUntilExpiry: Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isExpiring: (sub.endDate.getTime() - now.getTime()) < (3 * 24 * 60 * 60 * 1000),
      lastRenewal: sub.renewalHistory[0] || null
    }));

    return NextResponse.json({
      success: true,
      subscriptions: enrichedSubscriptions,
      count: enrichedSubscriptions.length
    });
  } catch (error) {
    logger.error('List subscriptions error:', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
