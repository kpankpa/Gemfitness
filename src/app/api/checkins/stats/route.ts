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
    const now = new Date();
    
    // midnight 
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Week start (Monday at midnight)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Run queries in parallel for better performance
    const [todayCount, activeNow, weekCount] = await Promise.all([
      // Today's total check-ins
      prisma.checkIn.count({ 
        where: { 
          checkInTime: { gte: todayStart } 
        } 
      }),
      // Currently active (checked in but not checked out)
      prisma.checkIn.count({ 
        where: { 
          checkInTime: { gte: todayStart },
          checkOutTime: null 
        } 
      }),
      // This week's total check-ins
      prisma.checkIn.count({ 
        where: { 
          checkInTime: { gte: weekStart } 
        } 
      })
    ]);

    return NextResponse.json({
      success: true,
      todayCount,
      activeNow,
      weekCount
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
