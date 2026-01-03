import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { sendEmail } from '@/lib/services/email/mock';

// POST /api/classes/[id]/waitlist/notify - Notify next person on waitlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;

    // Get class details
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if there are available spots
    const availableSpots = classData.maxCapacity - classData._count.bookings;
    if (availableSpots <= 0) {
      return NextResponse.json(
        { success: false, error: 'No available spots' },
        { status: 400 }
      );
    }

    // Get next person on waitlist
    const nextInLine = await prisma.waitlist.findFirst({
      where: {
        classId,
        status: 'waiting',
      },
      orderBy: {
        position: 'asc',
      },
      include: {
        user: true,
      },
    });

    if (!nextInLine) {
      return NextResponse.json(
        { success: false, error: 'No one on waitlist' },
        { status: 404 }
      );
    }

    // Update waitlist entry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour window

    await prisma.waitlist.update({
      where: { id: nextInLine.id },
      data: {
        status: 'notified',
        notifiedAt: new Date(),
        expiresAt,
      },
    });

    // Check user's notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: nextInLine.userId },
    });

    const emailEnabled = preferences?.emailEnabled !== false;
    const dashboardEnabled = preferences?.dashboardEnabled !== false;

    // Send email notification
    if (emailEnabled) {
      await sendEmail({
        to: nextInLine.user.email,
        subject: `Spot Available: ${classData.name}`,
        html: `
          <h2>Good News! A Spot is Available</h2>
          <p>Hi ${nextInLine.user.firstName},</p>
          <p>Great news! A spot has opened up in <strong>${classData.name}</strong>.</p>
          <p><strong>Class Details:</strong></p>
          <ul>
            <li>Instructor: ${classData.instructor}</li>
            <li>Schedule: ${classData.schedule}</li>
            <li>Duration: ${classData.duration} minutes</li>
          </ul>
          <p><strong>You have 24 hours to claim your spot.</strong></p>
          <p>Log in to your dashboard to enroll now!</p>
          <p>Best regards,<br/>GemFitness Team</p>
        `,
      });
    }

    // Create dashboard notification
    if (dashboardEnabled) {
      await prisma.notification.create({
        data: {
          userId: nextInLine.userId,
          type: 'WAITLIST_SPOT_AVAILABLE',
          subject: `Spot Available: ${classData.name}`,
          message: `A spot has opened up in ${classData.name}. You have 24 hours to enroll.`,
          sentAt: new Date(),
          status: 'sent',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notified: {
        user: {
          id: nextInLine.user.id,
          name: `${nextInLine.user.firstName} ${nextInLine.user.lastName}`,
          email: nextInLine.user.email,
        },
        position: nextInLine.position,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error notifying waitlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
