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

// GET /api/checkins - Get today's check-ins
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    // Get today in UTC (database stores timestamps in UTC)
    const now = new Date();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    logger.info('Fetching check-ins', { today: today.toISOString(), tomorrow: tomorrow.toISOString(), limit });

    const checkIns = await prisma.checkIn.findMany({
      where: {
        checkInTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            qrCode: true
          }
        }
      },
      orderBy: { checkInTime: 'desc' },
      ...(limit && { take: parseInt(limit) })
    });

    logger.info(`Found ${checkIns.length} check-ins for today`);

    const formattedCheckIns = checkIns.map(checkIn => ({
      id: checkIn.id,
      member: `${checkIn.user.firstName} ${checkIn.user.lastName}`,
      memberId: checkIn.user.qrCode,
      time: checkIn.checkInTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      method: checkIn.method,
      checkedBy: checkIn.checkedBy || 'system',
      checkInTime: checkIn.checkInTime
    }));

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
    const body = await request.json();
    console.log('📋 Check-in request body:', body);
    const { userId, qrCode, method = 'qr', checkedBy } = body;

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