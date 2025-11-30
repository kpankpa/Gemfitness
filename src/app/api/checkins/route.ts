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

// GET /api/checkins - Get today's check-ins
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
      orderBy: { checkInTime: 'desc' }
    });

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
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}

// POST /api/checkins - Create new check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, qrCode, method = 'qr', checkedBy } = body;

    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } else if (qrCode) {
      user = await prisma.user.findUnique({
        where: { qrCode }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member has active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      }
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'Member does not have an active subscription' },
        { status: 403 }
      );
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id,
        method,
        checkedBy
      }
    });

    return NextResponse.json({ 
      success: true, 
      checkIn: {
        id: checkIn.id,
        member: `${user.firstName} ${user.lastName}`,
        time: checkIn.checkInTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        })
      }
    });

  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}