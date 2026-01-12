// Payment History API
// src/app/api/payments/history/route.ts

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'success', 'pending', 'failed'
    const method = searchParams.get('method'); // 'paystack', 'momo', 'cash'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (method) {
      whereClause.paymentMethod = method;
    }
    
    if (startDate || endDate) {
      whereClause.paidAt = {};
      if (startDate) {
        whereClause.paidAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.paidAt.lte = new Date(endDate);
      }
    }

    // Get payment transactions with user details
    const [transactions, totalCount] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              subscriptions: {
                where: { status: 'ACTIVE' },
                select: { plan: true },
                take: 1
              }
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.paymentTransaction.count({ where: whereClause })
    ]);

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      transactionType: transaction.transactionType,
      paidAt: transaction.paidAt,
      createdAt: transaction.createdAt,
      member: transaction.user ? {
        id: transaction.user.id,
        name: `${transaction.user.firstName} ${transaction.user.lastName}`,
        email: transaction.user.email,
        plan: transaction.user.subscriptions[0]?.plan || 'Unknown'
      } : null,
      metadata: transaction.metadata
    }));

    // Calculate summary stats for the filtered period
    const summaryStats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true }
    });

    const totalRevenue = summaryStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0);
    const successfulPayments = summaryStats.find(s => s.status === 'success');
    const pendingPayments = summaryStats.find(s => s.status === 'pending');
    const failedPayments = summaryStats.find(s => s.status === 'failed');

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalRevenue,
        totalTransactions: summaryStats.reduce((sum, stat) => sum + stat._count.id, 0),
        successfulPayments: {
          count: successfulPayments?._count.id || 0,
          amount: successfulPayments?._sum.amount || 0
        },
        pendingPayments: {
          count: pendingPayments?._count.id || 0,
          amount: pendingPayments?._sum.amount || 0
        },
        failedPayments: {
          count: failedPayments?._count.id || 0,
          amount: failedPayments?._sum.amount || 0
        }
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}