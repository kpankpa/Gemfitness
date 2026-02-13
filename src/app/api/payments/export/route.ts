// Payment Export API - CSV Export for Accounting
// src/app/api/payments/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

export async function GET(request: NextRequest) {
  try {
    // Verify manager/admin access
    const session = await verifySessionForApi();
    if (!session.isAuth || !['ADMIN', 'MANAGER'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause (same as history route)
    const whereClause: Prisma.PaymentTransactionWhereInput = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (method && method !== 'all') {
      whereClause.paymentMethod = method;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search?.trim()) {
      whereClause.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch all matching transactions (no limit for export)
    const transactions = await prisma.paymentTransaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
    });

    // Generate CSV content
    const csvRows: string[] = [];
    
    // CSV Header
    csvRows.push([
      'Date',
      'Time',
      'Reference',
      'Member Name',
      'Email',
      'Phone',
      'Plan',
      'Amount',
      'Currency',
      'Payment Method',
      'Transaction Type',
      'Status',
      'Paid At'
    ].join(','));

    // CSV Data Rows
    transactions.forEach((tx) => {
      const paidAtDate = tx.paidAt ? new Date(tx.paidAt) : null;
      const createdDate = new Date(tx.createdAt);
      
      const row = [
        createdDate.toLocaleDateString('en-GB'),
        createdDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        `"${tx.reference}"`,
        tx.user ? `"${tx.user.firstName} ${tx.user.lastName}"` : 'N/A',
        tx.user?.email || 'N/A',
        tx.user?.phone || 'N/A',
        tx.user?.subscriptions[0]?.plan?.replace(/_/g, ' ') || 'N/A',
        tx.amount.toString(),
        tx.currency,
        formatMethodForCSV(tx.paymentMethod),
        tx.transactionType || 'N/A',
        tx.status.toUpperCase(),
        paidAtDate ? paidAtDate.toLocaleString('en-GB') : 'N/A'
      ];
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Generate filename with date range
    const filename = `gemfitness-receipts-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export receipts' },
      { status: 500 }
    );
  }
}

function formatMethodForCSV(method: string): string {
  if (method === 'paystack') return 'Card/Bank';
  if (method === 'momo') return 'MTN MoMo';
  return method.toUpperCase();
}
