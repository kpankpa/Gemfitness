import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email/mock';

// GET /api/cron/send-reminders - Send automated reminders for upcoming classes and events
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    let classRemindersSent = 0;
    let eventRemindersSent = 0;

    // ========== CLASS REMINDERS ==========
    // Get all upcoming class bookings within the reminder window
    const upcomingClassBookings = await prisma.classBooking.findMany({
      where: {
        status: 'confirmed',
        bookedFor: {
          gte: now,
          lte: reminderWindow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            instructor: true,
            schedule: true,
            duration: true,
            type: true,
          },
        },
      },
    });

    // Send class reminders
    for (const booking of upcomingClassBookings) {
      try {
        // Check if reminder already sent
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: booking.userId,
            type: 'CLASS_REMINDER',
            subject: { contains: booking.class.name },
            sentAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24h
            },
          },
        });

        if (existingNotification) {
          continue; // Skip if already sent
        }

        // Get user preferences
        const preferences = await prisma.notificationPreference.findUnique({
          where: { userId: booking.userId },
        });

        const emailEnabled =
          preferences?.emailEnabled !== false &&
          preferences?.classReminders !== false;
        const dashboardEnabled =
          preferences?.dashboardEnabled !== false &&
          preferences?.classReminders !== false;

        if (!emailEnabled && !dashboardEnabled) {
          continue; // User has disabled reminders
        }

        const reminderMessage = `This is a reminder that you have a class tomorrow: ${
          booking.class.name
        } with ${booking.class.instructor}.\n\nSchedule: ${
          booking.class.schedule
        }\nDuration: ${booking.class.duration} minutes\nDate: ${new Date(
          booking.bookedFor
        ).toLocaleDateString()}`;

        // Send email reminder
        if (emailEnabled) {
          await sendEmail({
            to: booking.user.email,
            subject: `Class Reminder: ${booking.class.name} Tomorrow`,
            html: `
              <h2>Class Reminder</h2>
              <p>Hi ${booking.user.firstName},</p>
              <p>This is a friendly reminder that you have a class tomorrow!</p>
              <p><strong>Class Details:</strong></p>
              <ul>
                <li>Class: ${booking.class.name}</li>
                <li>Type: ${booking.class.type}</li>
                <li>Instructor: ${booking.class.instructor}</li>
                <li>Schedule: ${booking.class.schedule}</li>
                <li>Duration: ${booking.class.duration} minutes</li>
                <li>Date: ${new Date(booking.bookedFor).toLocaleDateString()}</li>
              </ul>
              <p>We look forward to seeing you there!</p>
              <p>Best regards,<br/>GemFitness Team</p>
            `,
          });
        }

        // Create dashboard notification
        if (dashboardEnabled) {
          await prisma.notification.create({
            data: {
              userId: booking.userId,
              type: 'CLASS_REMINDER',
              subject: `Class Reminder: ${booking.class.name} Tomorrow`,
              message: reminderMessage,
              sentAt: new Date(),
              status: 'sent',
            },
          });
        }

        classRemindersSent++;
      } catch (error) {
        console.error(
          `Failed to send class reminder to ${booking.user.email}:`,
          error
        );
      }
    }

    // ========== EVENT REMINDERS ==========
    // Get all upcoming event bookings within the reminder window
    const upcomingEventBookings = await prisma.eventBooking.findMany({
      where: {
        status: 'registered',
        event: {
          eventDate: {
            gte: now,
            lte: reminderWindow,
          },
          status: {
            in: ['UPCOMING', 'ONGOING'],
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            location: true,
            isFree: true,
            price: true,
          },
        },
      },
    });

    // Send event reminders
    for (const booking of upcomingEventBookings) {
      try {
        // Check if reminder already sent
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: booking.userId,
            type: 'EVENT_REMINDER',
            subject: { contains: booking.event.title },
            sentAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (existingNotification) {
          continue;
        }

        // Get user preferences
        const preferences = await prisma.notificationPreference.findUnique({
          where: { userId: booking.userId },
        });

        const emailEnabled =
          preferences?.emailEnabled !== false &&
          preferences?.eventReminders !== false;
        const dashboardEnabled =
          preferences?.dashboardEnabled !== false &&
          preferences?.eventReminders !== false;

        if (!emailEnabled && !dashboardEnabled) {
          continue;
        }

        const reminderMessage = `This is a reminder that you're registered for: ${
          booking.event.title
        }\n\nDate: ${new Date(
          booking.event.eventDate
        ).toLocaleDateString()}\nLocation: ${
          booking.event.location || 'GemFitness Tema'
        }`;

        // Send email reminder
        if (emailEnabled) {
          await sendEmail({
            to: booking.user.email,
            subject: `Event Reminder: ${booking.event.title} Tomorrow`,
            html: `
              <h2>Event Reminder</h2>
              <p>Hi ${booking.user.firstName},</p>
              <p>This is a friendly reminder that you're registered for an event tomorrow!</p>
              <p><strong>Event Details:</strong></p>
              <ul>
                <li>Event: ${booking.event.title}</li>
                <li>Date: ${new Date(booking.event.eventDate).toLocaleDateString()}</li>
                <li>Location: ${booking.event.location || 'GemFitness Tema'}</li>
                <li>Price: ${
                  booking.event.isFree
                    ? 'Free'
                    : `GH₵ ${booking.event.price}`
                }</li>
              </ul>
              ${
                booking.event.description
                  ? `<p>${booking.event.description}</p>`
                  : ''
              }
              <p>We can't wait to see you there!</p>
              <p>Best regards,<br/>GemFitness Team</p>
            `,
          });
        }

        // Create dashboard notification
        if (dashboardEnabled) {
          await prisma.notification.create({
            data: {
              userId: booking.userId,
              type: 'EVENT_REMINDER',
              subject: `Event Reminder: ${booking.event.title} Tomorrow`,
              message: reminderMessage,
              sentAt: new Date(),
              status: 'sent',
            },
          });
        }

        eventRemindersSent++;
      } catch (error) {
        console.error(
          `Failed to send event reminder to ${booking.user.email}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      details: {
        classRemindersSent,
        eventRemindersSent,
        totalSent: classRemindersSent + eventRemindersSent,
      },
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
