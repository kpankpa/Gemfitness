/**
 * Class Cancellation Service
 * Handles class cancellation with automatic member notifications
 * 
 * src/lib/services/scheduling/cancellation-service.ts
 */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import { sendEmail } from '@/lib/services/email/mock';

export interface CancellationResult {
  success: boolean;
  classId: string;
  className: string;
  cancelledAt: Date;
  membersNotified: number;
  alternativeClassesOffered: string[];
  message: string;
}

export interface CancellationDetails {
  classId: string;
  reason: string;
  alternativeClassIds?: string[];
  cancelledBy: string;
  notifyMembers?: boolean;
}

/**
 * Cancel a class and notify all booked members
 */
export async function cancelClass(
  details: CancellationDetails
): Promise<CancellationResult> {
  try {
    const { classId, reason, alternativeClassIds = [], cancelledBy, notifyMembers = true } = details;

    // Get the class with bookings
    const classToCancel = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                notificationPreferences: true,
              },
            },
          },
        },
      },
    });

    if (!classToCancel) {
      throw new Error('Class not found');
    }

    if (classToCancel.status === 'CANCELLED') {
      throw new Error('Class is already cancelled');
    }

    // Get alternative classes info if provided
    const alternativeClasses = alternativeClassIds.length > 0
      ? await prisma.class.findMany({
          where: { 
            id: { in: alternativeClassIds },
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            schedule: true,
            instructor: true,
          },
        })
      : [];

    // Update class status to CANCELLED
    const cancelledAt = new Date();
    await prisma.class.update({
      where: { id: classId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt,
        cancelledBy,
      },
    });

    // Create cancellation record
    await prisma.classCancellation.create({
      data: {
        classId,
        reason,
        alternativeClasses: alternativeClassIds,
        membersNotified: false, // Will update after sending notifications
        cancelledBy,
      },
    });

    // Update all bookings to cancelled
    await prisma.classBooking.updateMany({
      where: { 
        classId,
        status: 'confirmed',
      },
      data: { 
        status: 'cancelled',
      },
    });

    // Clear waitlist for this class
    await prisma.waitlist.updateMany({
      where: { 
        classId,
        status: 'waiting',
      },
      data: { 
        status: 'expired',
      },
    });

    let membersNotified = 0;

    // Notify members if requested
    if (notifyMembers && classToCancel.bookings.length > 0) {
      for (const booking of classToCancel.bookings) {
        try {
          // Check user notification preferences
          const prefs = booking.user.notificationPreferences;
          const emailEnabled = prefs?.emailEnabled !== false && prefs?.classReminders !== false;
          const dashboardEnabled = prefs?.dashboardEnabled !== false;

          // Create dashboard notification
          if (dashboardEnabled) {
            await prisma.notification.create({
              data: {
                userId: booking.user.id,
                type: 'CLASS_CANCELLED',
                subject: `Class Cancelled: ${classToCancel.name}`,
                message: buildCancellationMessage(
                  booking.user.firstName,
                  classToCancel.name,
                  classToCancel.schedule,
                  reason,
                  alternativeClasses
                ),
                status: 'pending',
              },
            });
          }

          // Send email notification
          if (emailEnabled) {
            await sendClassCancellationEmail(
              booking.user.email,
              booking.user.firstName,
              classToCancel.name,
              classToCancel.schedule,
              classToCancel.instructor,
              reason,
              alternativeClasses
            );
          }

          membersNotified++;
        } catch (notifyError) {
          logger.error('Error notifying member about cancellation:', {
            userId: booking.user.id,
            error: notifyError,
          });
        }
      }

      // Update cancellation record
      await prisma.classCancellation.update({
        where: { classId },
        data: { membersNotified: true },
      });
    }

    logger.info('Class cancelled successfully:', {
      classId,
      className: classToCancel.name,
      membersNotified,
    });

    return {
      success: true,
      classId,
      className: classToCancel.name,
      cancelledAt,
      membersNotified,
      alternativeClassesOffered: alternativeClasses.map(c => c.name),
      message: `Class "${classToCancel.name}" has been cancelled. ${membersNotified} members have been notified.`,
    };
  } catch (error) {
    logger.error('Error cancelling class:', error);
    throw error;
  }
}

/**
 * Build cancellation notification message
 */
function buildCancellationMessage(
  firstName: string,
  className: string,
  schedule: string,
  reason: string,
  alternativeClasses: Array<{ name: string; schedule: string; instructor: string }>
): string {
  let message = `Hi ${firstName},\n\n`;
  message += `We regret to inform you that the class "${className}" (${schedule}) has been cancelled.\n\n`;
  message += `Reason: ${reason}\n\n`;

  if (alternativeClasses.length > 0) {
    message += `Alternative classes you might be interested in:\n`;
    for (const alt of alternativeClasses) {
      message += `• ${alt.name} - ${alt.schedule} with ${alt.instructor}\n`;
    }
    message += `\nVisit your dashboard to book one of these alternatives.\n\n`;
  }

  message += `We apologize for any inconvenience caused.\n\n`;
  message += `Best regards,\nGemFitness Team`;

  return message;
}

/**
 * Send class cancellation email
 */
async function sendClassCancellationEmail(
  email: string,
  firstName: string,
  className: string,
  schedule: string,
  instructor: string,
  reason: string,
  alternativeClasses: Array<{ name: string; schedule: string; instructor: string }>
): Promise<void> {
  const alternativesHtml = alternativeClasses.length > 0
    ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin: 0 0 10px; color: #166534;">Alternative Classes Available</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${alternativeClasses.map(alt => `
            <li style="margin: 5px 0;">
              <strong>${alt.name}</strong><br>
              <span style="color: #666;">${alt.schedule} with ${alt.instructor}</span>
            </li>
          `).join('')}
        </ul>
        <p style="margin: 15px 0 0; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gemfitness.com'}/dashboard/member" 
             style="color: #22c55e; text-decoration: none; font-weight: bold;">
            Book an alternative class →
          </a>
        </p>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .cancelled-badge { display: inline-block; background: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 15px 0; }
        .class-details { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .reason-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️ Class Cancellation Notice</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          
          <p>We're sorry to inform you that the following class has been <span class="cancelled-badge">CANCELLED</span></p>
          
          <div class="class-details">
            <h3 style="margin: 0 0 15px; color: #1f2937;">${className}</h3>
            <p style="margin: 5px 0;"><strong>Schedule:</strong> ${schedule}</p>
            <p style="margin: 5px 0;"><strong>Instructor:</strong> ${instructor}</p>
          </div>
          
          <div class="reason-box">
            <p style="margin: 0;"><strong>Reason for cancellation:</strong></p>
            <p style="margin: 10px 0 0;">${reason}</p>
          </div>
          
          ${alternativesHtml}
          
          <p>We sincerely apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact us.</p>
          
          <p><strong>The GemFitness Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} GemFitness. All rights reserved.</p>
          <p>Need help? Contact us at support@gemfitness.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `⚠️ Class Cancelled: ${className}`,
    html,
    from: 'GemFitness Classes <classes@gemfitness.com>',
  });
}

/**
 * Get cancellation details for a class
 */
export async function getCancellationDetails(classId: string): Promise<{
  class: {
    id: string;
    name: string;
    schedule: string;
    instructor: string;
  };
  cancellation: {
    reason: string;
    cancelledAt: Date;
    cancelledBy: string;
    membersNotified: boolean;
    alternativeClasses: string[];
  } | null;
} | null> {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        schedule: true,
        instructor: true,
        status: true,
      },
    });

    if (!classData) return null;

    const cancellation = await prisma.classCancellation.findUnique({
      where: { classId },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      class: classData,
      cancellation: cancellation ? {
        reason: cancellation.reason,
        cancelledAt: cancellation.cancelledAt,
        cancelledBy: `${cancellation.staff.firstName} ${cancellation.staff.lastName}`,
        membersNotified: cancellation.membersNotified,
        alternativeClasses: cancellation.alternativeClasses,
      } : null,
    };
  } catch (error) {
    logger.error('Error getting cancellation details:', error);
    throw error;
  }
}

/**
 * Get classes that can be offered as alternatives
 */
export async function getSuggestedAlternatives(
  classId: string
): Promise<Array<{
  id: string;
  name: string;
  type: string;
  schedule: string;
  instructor: string;
  availableSpots: number;
}>> {
  try {
    const originalClass = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        type: true,
        schedule: true,
      },
    });

    if (!originalClass) return [];

    // Find similar active classes
    const alternatives = await prisma.class.findMany({
      where: {
        id: { not: classId },
        status: 'ACTIVE',
        OR: [
          { type: originalClass.type }, // Same type
          { schedule: { contains: originalClass.schedule.split(' ')[0] } }, // Same day
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        schedule: true,
        instructor: true,
        maxCapacity: true,
        _count: {
          select: {
            bookings: {
              where: { status: 'confirmed' },
            },
          },
        },
      },
      take: 5,
    });

    return alternatives.map(alt => ({
      id: alt.id,
      name: alt.name,
      type: alt.type,
      schedule: alt.schedule,
      instructor: alt.instructor,
      availableSpots: alt.maxCapacity - alt._count.bookings,
    })).filter(alt => alt.availableSpots > 0);
  } catch (error) {
    logger.error('Error getting suggested alternatives:', error);
    throw error;
  }
}
