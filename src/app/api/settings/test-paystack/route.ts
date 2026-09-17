import { NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/settings/test-paystack
 * Verify Paystack API credentials by calling the bank list endpoint.
 */
export async function POST() {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'PAYSTACK_SECRET_KEY is not configured in the environment',
        },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.paystack.co/bank?country=ghana&perPage=1', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Paystack connection failed',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Paystack connection successful',
      testMode: process.env.PAYSTACK_TEST_MODE === 'true',
      publicKeyConfigured: Boolean(process.env.PAYSTACK_PUBLIC_KEY),
    });
  } catch (error) {
    console.error('Paystack test connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test Paystack connection' },
      { status: 500 }
    );
  }
}
