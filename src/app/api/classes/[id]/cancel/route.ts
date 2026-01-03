import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

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

    const { id: classId } = await params;
    const body = await request.json();
    const { reason, notifyMembers = true } = body;

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Check if class exists and is not already cancelled
    const classToCancel = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!classToCancel) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (classToCancel.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Class is already cancelled' },
        { status: 400 }
      );
    }

    // Update class status to cancelled
    await prisma.class.update({
      where: { id: classId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: session.userId,
      }
    });

    let notifiedMembers = 0;

    // Send notifications to enrolled members
    if (notifyMembers && classToCancel.bookings.length > 0) {
      const memberEmails = classToCancel.bookings.map(booking => booking.user.email);
      
      try {
        // Create notification records
        await prisma.notification.createMany({
          data: classToCancel.bookings.map(booking => ({
            userId: booking.user.id,
            type: 'CLASS_CANCELLED',
            subject: `Class Cancelled: ${classToCancel.name}`,
            message: `Unfortunately, the ${classToCancel.name} class scheduled for ${classToCancel.schedule} has been cancelled. Reason: ${reason}`,
            status: 'pending',
          }))
        });

        // Send email notifications (you can implement email service here)
        // For now, we'll just count the notifications created
        notifiedMembers = classToCancel.bookings.length;

        console.log(`Class cancellation notifications sent to: ${memberEmails.join(', ')}`);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the cancellation if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Class cancelled successfully',
      notifiedMembers,
      class: {
        id: classToCancel.id,
        name: classToCancel.name,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Error cancelling class:', error);
    return NextResponse.json(
      { error: 'Failed to cancel class' },
      { status: 500 }
    );
  }
}