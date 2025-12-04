/**
 * CHECK-IN STATS API
 * 
 * Endpoint: GET /api/checkins/stats
 * Returns real-time check-in statistics
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Simple count queries only
    const [today, activeNow, thisWeek] = await Promise.all([
      prisma.checkIn.count({ where: { checkInTime: { gte: todayStart } } }),
      prisma.checkIn.count({ where: { checkInTime: { gte: todayStart }, checkOutTime: null } }),
      prisma.checkIn.count({ where: { checkInTime: { gte: todayStart } } })
    ]);

    return NextResponse.json({
      success: true,
      stats: { today, activeNow, thisWeek }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
