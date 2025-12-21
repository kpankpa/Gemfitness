import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromQR, validateQRCode } from '@/lib/qr/generator';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rateLimiter';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isStaff } from '@/lib/auth/permissions';

export async function GET(request: NextRequest) {
  try {
    // Require staff session (receptionist/admin/manager) to prevent public enumeration
    const session = await verifySessionForApi();
    if (!session || !session.isAuth) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    if (!isStaff(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const qr = searchParams.get('qr');

    if (!qr) return NextResponse.json({ success: false, error: 'qr parameter required' }, { status: 400 });

    // Basic validation
    if (!validateQRCode(qr)) {
      return NextResponse.json({ success: false, error: 'Invalid QR format' }, { status: 400 });
    }

    // Rate limit per QR string (prevents brute-force/enum)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anon';
    const identity = session.userId ?? ip;
    const rl = rateLimit(`lookup:${identity}:${qr}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    // Try token-based lookup first
    const token = extractTokenFromQR(qr);
    let user = null;

    if (token) {
      user = await prisma.user.findUnique({
        where: { qrCode: token },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });
    }

    // Fallback to legacy exact match
    if (!user) {
      user = await prisma.user.findUnique({
        where: { qrCode: qr },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });
    }

    if (!user) return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });

    // Compute membership status
    const activeSub = user.subscriptions?.[0] ?? null;
    let membership = { status: 'none', daysLeft: 0, plan: null as string | null };

    if (activeSub) {
      const now = new Date();
      const end = new Date(activeSub.endDate);
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      membership = {
        status: diff > 0 ? (diff <= 3 ? 'expiring_soon' : 'active') : 'expired',
        daysLeft: diff,
        plan: activeSub.plan
      };
    }

    // Last check-in
    const lastCheckIn = await prisma.checkIn.findFirst({
      where: { userId: user.id },
      orderBy: { checkInTime: 'desc' }
    });

    const payload = {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage || null,
        qrCode: user.qrCode ? `GYM|${user.qrCode}` : null,
        registrationPaid: user.registrationPaid
      },
      membership,
      lastCheckIn: lastCheckIn ? lastCheckIn.checkInTime.toISOString() : null
    };

    return NextResponse.json(payload);
  } catch (error) {
    logger.error('Error in /api/checkins/lookup', error);
    return NextResponse.json({ success: false, error: 'Lookup failed' }, { status: 500 });
  }
}
