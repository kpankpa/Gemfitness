/**
 * DAY PASS LIST / MANAGEMENT API
 *
 * GET  /api/day-pass/list — List all day passes with filters
 * POST /api/day-pass/list — Admin: expire/void a day pass early
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

/**
 * GET /api/day-pass/list
 *
 * Query params:
 *  - page (default 1)
 *  - limit (default 20)
 *  - status: active | expired | all (default all)
 *  - search: name or phone
 *  - date: YYYY-MM-DD — filter by a specific day
 *  - startDate, endDate: date range
 *  - payment: cash | momo | all
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = req.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const statusParam = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search')?.trim() || '';
    const date = url.searchParams.get('date') || '';
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const paymentFilter = url.searchParams.get('payment') || 'all';

    const now = new Date();

    // Build subscription where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      plan: 'DAILY',
    };

    // Status filter
    if (statusParam === 'active') {
      where.status = 'ACTIVE';
      where.endDate = { gte: now };
    } else if (statusParam === 'expired') {
      where.OR = [
        { status: { not: 'ACTIVE' } },
        { endDate: { lt: now } },
      ];
    }

    // Date filter
    if (date) {
      // Parse date string in local timezone to avoid UTC conversion issues
      const [year, month, day] = date.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
      where.startDate = { gte: dayStart, lte: dayEnd };
      console.log('📅 Filtering by date:', { date, dayStart, dayEnd, serverNow: now });
    } else if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        const [year, month, day] = startDate.split('-').map(Number);
        const sd = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.startDate.gte = sd;
      }
      if (endDate) {
        const [year, month, day] = endDate.split('-').map(Number);
        const ed = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.startDate.lte = ed;
      }
    }

    // Search by user name or phone
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    // Count total
    const total = await prisma.subscription.count({ where });

    console.log('🔍 Day pass query:', { 
      where, 
      totalCount: total,
      filters: { statusParam, paymentFilter, search, date, startDate, endDate }
    });

    // Fetch subscriptions with user data
    const dayPasses = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            emergencyContact: true,
            emergencyPhone: true,
          },
        },
        payments: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            reference: true,
            createdAt: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Also fetch related payment transactions for richer data
    const subscriptionIds = dayPasses.map((dp) => dp.id);
    const transactions = await prisma.paymentTransaction.findMany({
      where: {
        transactionType: 'day_pass',
        relatedEntityId: { in: subscriptionIds },
      },
      select: {
        id: true,
        reference: true,
        amount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        relatedEntityId: true,
      },
    });

    const txBySubscription = new Map<string, typeof transactions[0]>();
    for (const tx of transactions) {
      if (tx.relatedEntityId) {
        txBySubscription.set(tx.relatedEntityId, tx);
      }
    }

    // Filter by payment method if needed (after DB query since it's a join)
    let mapped = dayPasses.map((dp) => {
      const payment = dp.payments[0] || null;
      const tx = txBySubscription.get(dp.id) || null;
      // More robust active check using timestamps
      const endDateTimestamp = dp.endDate.getTime();
      const nowTimestamp = now.getTime();
      const isActive = dp.status === 'ACTIVE' && endDateTimestamp > nowTimestamp;
      const payMethod = payment?.paymentMethod || tx?.paymentMethod || 'unknown';

      return {
        id: dp.id,
        userId: dp.userId,
        firstName: dp.user.firstName,
        lastName: dp.user.lastName,
        phone: dp.user.phone,
        email: dp.user.email,
        emergencyContact: dp.user.emergencyContact,
        emergencyPhone: dp.user.emergencyPhone,
        status: isActive ? 'active' : 'expired',
        startDate: dp.startDate.toISOString(),
        endDate: dp.endDate.toISOString(),
        amount: dp.amount,
        paymentMethod: payMethod,
        paymentStatus: payment?.status || tx?.status || 'unknown',
        reference: payment?.reference || tx?.reference || '',
        transactionId: tx?.id || payment?.id || '',
        paidAt: tx?.paidAt?.toISOString() || payment?.createdAt?.toISOString() || dp.startDate.toISOString(),
      };
    });

    // Payment method filter (client-side due to join complexity)
    if (paymentFilter !== 'all') {
      mapped = mapped.filter((dp) => {
        if (paymentFilter === 'cash') return dp.paymentMethod.toLowerCase().includes('cash');
        if (paymentFilter === 'momo') return dp.paymentMethod.toLowerCase().includes('momo');
        return true;
      });
    }

    console.log('✅ Day passes mapped:', { 
      count: mapped.length, 
      firstPass: mapped[0],
      activeCount: mapped.filter(dp => dp.status === 'active').length
    });

    // Stats for the page
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayCount, todayRevenue, totalAllTime, activeNow] = await Promise.all([
      prisma.subscription.count({
        where: { plan: 'DAILY', startDate: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.subscription.aggregate({
        where: { plan: 'DAILY', startDate: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.subscription.count({ where: { plan: 'DAILY' } }),
      prisma.subscription.count({
        where: { plan: 'DAILY', status: 'ACTIVE', endDate: { gte: now } },
      }),
    ]);

    // Week stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [weekCount, weekRevenue] = await Promise.all([
      prisma.subscription.count({
        where: { plan: 'DAILY', startDate: { gte: weekStart } },
      }),
      prisma.subscription.aggregate({
        where: { plan: 'DAILY', startDate: { gte: weekStart } },
        _sum: { amount: true },
      }),
    ]);

    // Month stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [monthCount, monthRevenue] = await Promise.all([
      prisma.subscription.count({
        where: { plan: 'DAILY', startDate: { gte: monthStart } },
      }),
      prisma.subscription.aggregate({
        where: { plan: 'DAILY', startDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      dayPasses: mapped,
      pagination: {
        page,
        limit,
        total: paymentFilter !== 'all' ? mapped.length : total,
        pages: Math.ceil((paymentFilter !== 'all' ? mapped.length : total) / limit),
      },
      stats: {
        today: {
          count: todayCount,
          revenue: todayRevenue._sum.amount || 0,
        },
        week: {
          count: weekCount,
          revenue: weekRevenue._sum.amount || 0,
        },
        month: {
          count: monthCount,
          revenue: monthRevenue._sum.amount || 0,
        },
        totalAllTime,
        activeNow,
      },
    });
  } catch (error) {
    console.error('Day pass list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day passes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/day-pass/list — Void / expire a day pass early
 *
 * Body: { subscriptionId: string, action: 'void' }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUserId = session.userId as string;

    // Only managers/admins can void
    const staffUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true },
    });
    if (!staffUser || !['ADMIN', 'MANAGER'].includes(staffUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { subscriptionId, action } = body;

    if (!subscriptionId || action !== 'void') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!subscription || subscription.plan !== 'DAILY') {
      return NextResponse.json({ error: 'Day pass not found' }, { status: 404 });
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: `Day pass for ${subscription.user.firstName} ${subscription.user.lastName} has been voided`,
    });
  } catch (error) {
    console.error('Day pass void error:', error);
    return NextResponse.json(
      { error: 'Failed to void day pass' },
      { status: 500 }
    );
  }
}
