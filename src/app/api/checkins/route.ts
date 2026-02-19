/**
 * CHECK-IN MANAGEMENT API
 * 
 * Endpoints:
 * - GET /api/checkins - Get today's check-ins
 * - POST /api/checkins - Create new check-in (QR or manual)
 * 
 * Used by: Admin Dashboard (Check-in tab), QR Scanner
 * Purpose: Member attendance tracking, check-in/check-out operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { extractTokenFromQR, validateQRCode } from '@/lib/qr/generator';
import { rateLimit } from '@/lib/rateLimiter';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isStaff } from '@/lib/auth/permissions';

// GET /api/checkins - Get check-ins (today by default, or date range)
export async function GET(request: NextRequest) {
  console.time('⏱️ TOTAL /api/checkins Request');
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const all = searchParams.get('all'); // When 'true', skip date filtering
    
    // Build date filter
    let dateFilter = {};
    
    if (all === 'true') {
      // No date filter - return all records
      dateFilter = {};
    } else if (startDate || endDate) {
      // Use provided date range
      dateFilter = {
        checkInTime: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) })
        }
      };
    } else {
      // Default to today in UTC (database stores timestamps in UTC)
      const now = new Date();
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      
      dateFilter = {
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      };
    }

    logger.info('Fetching check-ins', { dateFilter, limit });

    console.time('💾 Prisma Query - findMany checkIns');
    const checkIns = await prisma.checkIn.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            qrCode: true,
            profileImage: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' },
      ...(limit && { take: parseInt(limit) })
    });
    console.timeEnd('💾 Prisma Query - findMany checkIns');

    logger.info(`Found ${checkIns.length} check-ins for today`);

    console.time(' Format CheckIn Data');
    const formattedCheckIns = checkIns.map(checkIn => ({
      id: checkIn.id,
      member: `${checkIn.user.firstName} ${checkIn.user.lastName}`,
      memberId: checkIn.user.qrCode ? `GYM|${checkIn.user.qrCode}` : checkIn.user.id,
      time: checkIn.checkInTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      method: checkIn.method,
      checkedBy: checkIn.checkedBy || 'system',
      checkInTime: checkIn.checkInTime,
      profileImage: checkIn.user.profileImage,
      email: checkIn.user.email,
      phone: checkIn.user.phone
    }));
    console.timeEnd('🔄 Format CheckIn Data');

    console.timeEnd('⏱️ TOTAL /api/checkins Request');
    return NextResponse.json({ success: true, checkIns: formattedCheckIns });
  } catch (error) {
    logger.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// POST /api/checkins - Create new check-in
export async function POST(request: NextRequest) {
  console.log('🔍 /api/checkins POST endpoint hit');
  try {
    // Require staff session (receptionist/admin/manager)
    const session = await verifySessionForApi();
    if (!session || !session.isAuth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!isStaff(session)) {
      return NextResponse.json({ error: 'Forbidden — staff access required' }, { status: 403 });
    }

    const body = await request.json();
    console.log('📋 Check-in request received - sanitized');
    const { userId, qrCode, method = 'qr', checkedBy, forceCheckIn = false } = body;

    // Validate input
    if (!userId && !qrCode) {
      console.log('❌ Missing userId or qrCode');
      return NextResponse.json(
        { error: 'userId or qrCode is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Looking up user...');
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: {
              status: 'ACTIVE',
              endDate: { gte: new Date() }
            },
            orderBy: { endDate: 'desc' },
            take: 1
          }
        }
      });
    } else if (qrCode) {
      // Validate QR format early
      if (!validateQRCode(qrCode)) {
        return NextResponse.json({ error: 'Invalid QR format' }, { status: 400 });
      }

      // Rate limit per QR to prevent enumeration
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anon';
      const rl = rateLimit(`checkin:${ip}:${qrCode}`, 30, 60);
      if (!rl.allowed) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }

      // Support new format: GYM|<token>
      const token = extractTokenFromQR(qrCode);
      if (token) {
        user = await prisma.user.findUnique({
          where: { qrCode: token },
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() }
              },
              orderBy: { endDate: 'desc' },
              take: 1
            }
          }
        });
      }

      // Backwards compatible lookup: try raw QR string match if token lookup failed
      if (!user) {
        user = await prisma.user.findUnique({
          where: { qrCode },
          include: {
            subscriptions: {
              where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() }
              },
              orderBy: { endDate: 'desc' },
              take: 1
            }
          }
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member has active subscription
    const activeSubscription = user.subscriptions?.[0];
    console.log('📊 Active subscription check:', activeSubscription ? 'Found' : 'Not found');

    if (!activeSubscription) {
      console.log('❌ No active subscription');
      return NextResponse.json(
        { error: 'Member does not have an active subscription' },
        { status: 403 }
      );
    }

    // Validate subscription hasn't expired (critical for day passes)
    const now = new Date();
    if (activeSubscription.endDate && activeSubscription.endDate < now) {
      console.log('❌ Subscription expired:', activeSubscription.endDate);
      return NextResponse.json(
        { 
          error: 'Subscription expired',
          message: `Membership expired on ${activeSubscription.endDate.toLocaleDateString()}. Please renew to check in.`,
          expired: true,
          expiredDate: activeSubscription.endDate.toISOString(),
        },
        { status: 403 }
      );
    }

    // Check for duplicate check-in within 30 minutes (unless forced)
    if (!forceCheckIn) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const recentCheckIn = await prisma.checkIn.findFirst({
        where: {
          userId: user.id,
          checkInTime: {
            gte: thirtyMinutesAgo
          }
        },
        orderBy: {
          checkInTime: 'desc'
        }
      });

      if (recentCheckIn) {
        console.log('⚠️ Duplicate check-in detected:', recentCheckIn.checkInTime);
        const lastCheckInTime = recentCheckIn.checkInTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return NextResponse.json({
          success: false,
          duplicate: true,
          message: `Member already checked in at ${lastCheckInTime}`,
          lastCheckIn: {
            time: lastCheckInTime,
            method: recentCheckIn.method,
            checkedBy: recentCheckIn.checkedBy
          }
        }, { status: 409 }); // 409 Conflict
      }
    }

    // Create check-in record
    console.log('✅ Creating check-in record...');
    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id,
        method,
        checkedBy: checkedBy || 'system'
      }
    });

    console.log('✅ Check-in created:', checkIn.id);

    return NextResponse.json({ 
      success: true, 
      checkIn: {
        id: checkIn.id,
        member: `${user.firstName} ${user.lastName}`,
        time: checkIn.checkInTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        method: checkIn.method
      }
    });

  } catch (error) {
    console.error('❌ Check-in error:', error);
    logger.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create check-in' },
      { status: 500 }
    );
  }
}