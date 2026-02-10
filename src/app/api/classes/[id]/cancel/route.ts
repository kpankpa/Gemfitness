import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { cancelClass } from '@/lib/services/scheduling/cancellation-service';
import logger from '@/lib/logger';

// POST /api/classes/[id]/cancel - Cancel a class and notify members
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can cancel classes
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const { id: classId } = await params;
    const body = await request.json();
    const { reason, alternativeClassIds = [], notifyMembers = true } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Check if class exists and is not already cancelled
    const classToCheck = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classToCheck) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (classToCheck.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Class is already cancelled' },
        { status: 400 }
      );
    }

    // Use the cancellation service
    logger.info('Cancelling class:', {
      classId,
      className: classToCheck.name,
      reason,
    });

    const result = await cancelClass({
      classId,
      reason,
      alternativeClassIds,
      cancelledBy: session.userId,
      notifyMembers,
    });

    logger.info('Class cancelled successfully:', {
      classId,
      className: result.className,
      membersNotified: result.membersNotified,
    });

    return NextResponse.json({
      success: true,
      message: 'Class cancelled successfully',
      class: {
        id: result.classId,
        name: result.className,
        status: 'CANCELLED',
        cancelledAt: result.cancelledAt,
      },
      notifications: {
        sent: result.membersNotified,
      },
      alternativeClasses: result.alternativeClassesOffered,
    });

  } catch (error) {
    logger.error('Error cancelling class:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel class',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}