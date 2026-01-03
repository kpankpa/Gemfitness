import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/classes/[id]/enrollments
 * Get list of all enrolled members for a class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;

    const enrollments = await prisma.classBooking.findMany({
      where: {
        classId: classId,
        status: {
          in: ['confirmed', 'attended']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              select: {
                plan: true,
                endDate: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      userId: e.user.id,
      name: `${e.user.firstName} ${e.user.lastName}`,
      email: e.user.email,
      phone: e.user.phone,
      profileImage: e.user.profileImage,
      membershipPlan: e.user.subscriptions[0]?.plan || 'NONE',
      membershipExpiry: e.user.subscriptions[0]?.endDate.toISOString() || null,
      enrolledAt: e.createdAt.toISOString(),
      status: e.status
    }));

    return NextResponse.json({
      success: true,
      enrollments: formattedEnrollments,
      total: formattedEnrollments.length
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
