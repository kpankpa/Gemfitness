import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

export async function GET(_request: NextRequest) {
  try {
    // Verify admin/manager access
    const session = await verifySessionForApi();
    if (!session.isAuth || !['ADMIN', 'MANAGER'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Unauthorized', session }, { status: 401 });
    }

    console.log('🔍 Testing database queries...');

    // Test 1: Check if tables exist
    const paymentTransactionCount = await prisma.paymentTransaction.count();
    console.log('✅ PaymentTransaction count:', paymentTransactionCount);

    const paymentCount = await prisma.payment.count();
    console.log('✅ Payment count:', paymentCount);

    const subscriptionCount = await prisma.subscription.count();
    console.log('✅ Subscription count:', subscriptionCount);

    // Test 2: Check PaymentTransaction statuses
    const paymentTransactionStatuses = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('✅ PaymentTransaction statuses:', paymentTransactionStatuses);

    // Test 3: Check Payment statuses
    const paymentStatuses = await prisma.payment.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log('✅ Payment statuses:', paymentStatuses);

    // Test 4: Try the problematic query
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    try {
      const paymentMethodBreakdown = await prisma.paymentTransaction.groupBy({
        by: ['paymentMethod'],
        where: {
          status: 'success',
          paidAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: { id: true }
      });
      console.log('✅ PaymentTransaction query successful:', paymentMethodBreakdown);
    } catch (error) {
      console.error('❌ PaymentTransaction query failed:', error);
    }

    // Test 5: Check subscription with payments relation
    try {
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
      console.log('✅ Subscription with payments query successful:', activeSubscriptions.length);
    } catch (error) {
      console.error('❌ Subscription with payments query failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentTransactionCount,
        paymentCount,
        subscriptionCount,
        paymentTransactionStatuses,
        paymentStatuses,
        session: session
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}