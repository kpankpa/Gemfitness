/**
 * CHECK-IN STATS API
 * 
 * Endpoint: GET /api/checkins/stats
 * 
 * Returns real-time check-in statistics:
 * - Today's total check-ins
 * - Currently active members (checked in but not checked out)
 * - This week's total check-ins
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const now = new Date();
    
    // Today's check-ins (midnight to now in UTC)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    
    logger.info('Fetching check-in stats', { todayStart: todayStart.toISOString() });

    const todayCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: todayStart
        }
      }
    });

    // Currently active (checked in but not checked out)
    const activeNow = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: todayStart
        },
        checkOutTime: null
      }
    });

    // This week's check-ins (Monday to now)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    startOfWeek.setDate(startOfWeek.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: startOfWeek
        }
      }
    });

    logger.info('Check-in stats calculated', { 
      today: todayCheckIns, 
      activeNow, 
      thisWeek: weekCheckIns 
    });

    return NextResponse.json({
      success: true,
      stats: {
        today: todayCheckIns,
        activeNow: activeNow,
        thisWeek: weekCheckIns
      }
    });

  } catch (error) {
    logger.error('Error fetching check-in stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
