// Member Receipts API - Members view their own receipts
// src/app/api/member/receipts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    // Verify member is authenticated
    const session = await verifySessionForApi();
    if (!session.isAuth || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build where clause - member can only see their own transactions
    const whereClause: Prisma.PaymentTransactionWhereInput = {
      userId: session.userId,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Fetch member's transactions
    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              subscriptions: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { plan: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.paymentTransaction.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      transactionType: tx.transactionType,
      paidAt: tx.paidAt,
      createdAt: tx.createdAt,
      plan: tx.user?.subscriptions[0]?.plan || 'Unknown',
      metadata: tx.metadata,
    }));

    // Calculate summary for member
    const summaryStats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      where: { userId: session.userId },
      _sum: { amount: true },
      _count: { id: true }
    });

    const totalSpent = summaryStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0);
    const successfulPayments = summaryStats.find(s => s.status === 'success');

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
      summary: {
        totalSpent,
        totalTransactions: total,
        successfulPayments: {
          count: successfulPayments?._count.id || 0,
          amount: successfulPayments?._sum.amount || 0,
        }
      }
    });

  } catch (error) {
    console.error('Member receipts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
