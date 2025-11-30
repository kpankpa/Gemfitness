/**
 * MEMBER DASHBOARD DATA API
 * 
 * Endpoints:
 * - GET /api/member/dashboard?userId=xxx - Get individual member's dashboard data
 * - GET /api/member/dashboard?email=xxx - Get dashboard data by email
 * 
 * Used by: Member Dashboard (individual member view)
 * Purpose: Personal member data, bookings, check-ins, subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DashboardData } from '@/types';

// GET /api/member/dashboard?userId=xxx - Get member dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Find user
    let user;
    const userQuery = {
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        checkIns: {
          orderBy: { checkInTime: 'desc' },
          take: 10
        },
        classBookings: {
          where: { 
            status: 'confirmed',
            bookedFor: { gte: new Date() } // Future bookings only
          },
          include: {
            class: true
          },
          orderBy: { bookedFor: 'asc' }
        },
        _count: {
          select: {
            checkIns: true
          }
        }
      }
    } as const;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        ...userQuery
      });
    } else {
      user = await prisma.user.findUnique({
        where: { email: email! },
        ...userQuery
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate membership status
    const activeSubscription = user.subscriptions[0];
    let membershipStatus: 'active' | 'expired' | 'expiring_soon' | 'inactive' = 'inactive';
    let daysLeft = 0;

    if (activeSubscription) {
      const expiryDate = new Date(activeSubscription.endDate);
      const today = new Date();
      const timeDiff = expiryDate.getTime() - today.getTime();
      daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysLeft > 0) {
        membershipStatus = daysLeft <= 3 ? 'expiring_soon' : 'active';
      } else {
        membershipStatus = 'expired';
      }
    }

    // Format recent check-ins
    const recentCheckIns = user.checkIns.map(checkIn => ({
      id: checkIn.id,
      member: `${user.firstName} ${user.lastName}`,
      memberId: user.id,
      date: checkIn.checkInTime.toISOString().split('T')[0],
      time: checkIn.checkInTime.toLocaleTimeString('en-GH', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      method: checkIn.method as 'qr' | 'manual',
      checkedBy: checkIn.checkedBy || 'System'
    }));

    // Format booked classes
    const bookedClasses = user.classBookings.map(booking => ({
      id: booking.id,
      name: booking.class.name,
      className: booking.class.name,
      instructor: booking.class.instructor,
      bookedFor: booking.bookedFor.toISOString().split('T')[0],
      time: `${booking.bookedFor.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${new Date(booking.bookedFor.getTime() + booking.class.duration * 60000).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`,
      duration: `${booking.class.duration} mins`,
      type: booking.class.type,
      status: booking.status as 'confirmed' | 'cancelled' | 'attended',
      color: 'from-orange-500 to-orange-600' // Default gradient color
    }));

    // Get available classes (not booked by this user)
    const availableClasses = await prisma.class.findMany({
      where: {
        status: 'ACTIVE',
        NOT: {
          bookings: {
            some: {
              userId: user.id,
              status: 'confirmed',
              bookedFor: { gte: new Date() }
            }
          }
        }
      },
      take: 10
    });

    const formattedAvailableClasses = availableClasses.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description || '',
      instructor: cls.instructor,
      schedule: cls.schedule,
      time: cls.schedule, // Using schedule as time for now
      duration: `${cls.duration} mins`,
      type: cls.type,
      color: cls.color || 'from-blue-400 to-purple-500',
      spots: `${cls.maxCapacity - cls.currentBookings} spots left`
    }));

    const dashboardData: DashboardData = {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: user.role as 'MEMBER' | 'RECEPTIONIST' | 'MANAGER' | 'ADMIN',
        qrCode: user.qrCode || '',
        registrationPaid: user.registrationPaid,
        registrationType: user.registrationType as 'SINGLE' | 'COUPLE' | 'FAMILY',
        createdAt: user.createdAt.toISOString(),
        memberSince: user.createdAt.toISOString().split('T')[0]
      },
      membership: {
        status: membershipStatus,
        plan: activeSubscription?.plan?.replace(/_/g, ' ') || 'No Plan',
        expiresAt: activeSubscription?.endDate?.toISOString().split('T')[0] || null,
        daysLeft,
        amount: activeSubscription?.amount || 0
      },
      stats: {
        totalCheckIns: user._count.checkIns,
        totalPayments: user.subscriptions.length,
        thisMonthCheckIns: user.checkIns.filter(checkIn => {
          const checkInDate = new Date(checkIn.checkInTime);
          const today = new Date();
          return checkInDate.getMonth() === today.getMonth() && 
                 checkInDate.getFullYear() === today.getFullYear();
        }).length
      },
      recentCheckIns,
      bookedClasses,
      availableClasses: formattedAvailableClasses
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching member dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member dashboard data' },
      { status: 500 }
    );
  }
}