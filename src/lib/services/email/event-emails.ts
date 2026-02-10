/**
 * Event Email Service
 * Handles promotional emails and reminders for events
 * 
 * src/lib/services/email/event-emails.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

const DEV_MODE = process.env.SEND_EMAILS !== 'true';
const FROM_EMAIL = process.env.EMAIL_FROM || 'GemFitness <onboarding@resend.dev>';
const APP_NAME = 'GemFitness';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gemfitness.com';

// Import Resend conditionally
let resend: any = null;

if (!DEV_MODE) {
  try {
    // Dynamic import for conditional loading  
    import('resend').then((module) => {
      const Resend = module.Resend;
      resend = new Resend(process.env.RESEND_API_KEY);
    }).catch((error) => {
      logger.error('Failed to load Resend module:', error);
    });
  } catch (error) {
    logger.error('Failed to initialize Resend:', error);
  }
}

interface EventPromoEmailParams {
  eventId: string;
  targetAudience?: 'all' | 'members' | 'new';
  customMessage?: string;
}

interface EventReminderEmailParams {
  eventId: string;
  hoursBeforeEvent: number;
}

/**
 * Send promotional email for a new or upcoming event
 */
export async function sendEventPromotionalEmail(
  params: EventPromoEmailParams
): Promise<{ success: boolean; recipientCount: number; errors: string[] }> {
  try {
    const { eventId, targetAudience = 'all', customMessage } = params;

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Determine target audience
    const whereClause: {
      emailVerified: boolean;
      role: 'MEMBER';
      subscriptions?: { some: { status: string } };
      createdAt?: { gte: Date };
    } = {
      emailVerified: true,
      role: 'MEMBER' as const,
    };

    if (targetAudience === 'members') {
      // Only active members with valid subscriptions
      whereClause.subscriptions = {
        some: {
          status: 'ACTIVE' as const,
        },
      };
    } else if (targetAudience === 'new') {
      // Members registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.createdAt = {
        gte: thirtyDaysAgo,
      };
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where: whereClause as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        notificationPreferences: true,
      },
    });

    const errors: string[] = [];
    let sentCount = 0;

    // Format event date
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Send emails
    for (const user of users) {
      try {
        // Check notification preferences
        const prefs = (user as any).notificationPreferences;
        if (prefs?.emailEnabled === false || prefs?.eventReminders === false) {
          continue;
        }

        const emailHtml = buildEventPromoEmailHTML(
          user.firstName,
          event.title,
          event.description,
          formattedDate,
          formattedTime,
          event.location || 'GemFitness Tema',
          event.isFree,
          event.price,
          event.image,
          customMessage,
          eventId
        );

        if (DEV_MODE) {
          logger.info(`[DEV] Event promo email would be sent to ${user.email}`);
          sentCount++;
        } else if (resend) {
          const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [user.email],
            subject: `🎉 New Event: ${event.title}`,
            html: emailHtml,
          });

          if (error) {
            errors.push(`Failed to send to ${user.email}: ${error.message}`);
          } else {
            sentCount++;
          }
        }

        // Create notification record
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'EVENT_REMINDER',
            subject: `New Event: ${event.title}`,
            message: `${event.title} is happening on ${formattedDate} at ${formattedTime}. ${event.isFree ? 'Free event!' : `Price: GH₵ ${event.price}`}`,
            status: 'sent',
            sentAt: new Date(),
          },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error sending to ${user.email}: ${errorMsg}`);
        logger.error('Error sending event promo email:', { email: user.email, error });
      }
    }

    logger.info('Event promotional emails sent:', {
      eventId,
      eventTitle: event.title,
      sent: sentCount,
      errors: errors.length,
    });

    return {
      success: true,
      recipientCount: sentCount,
      errors,
    };
  } catch (error) {
    logger.error('Error sending event promotional emails:', error);
    throw error;
  }
}

/**
 * Send reminder emails to registered attendees
 */
export async function sendEventReminderEmails(
  params: EventReminderEmailParams
): Promise<{ success: boolean; recipientCount: number; errors: string[] }> {
  try {
    const { eventId, hoursBeforeEvent } = params;

    // Fetch event with bookings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: {
            status: { in: ['registered', 'confirmed'] },
          },
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

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'CANCELLED') {
      throw new Error('Cannot send reminders for cancelled event');
    }

    const errors: string[] = [];
    let sentCount = 0;

    // Format event date
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Send reminder emails
    for (const booking of event.bookings) {
      try {
        const user = booking.user;

        // Check notification preferences
        const prefs = user.notificationPreferences;
        if (prefs?.emailEnabled === false || prefs?.eventReminders === false) {
          continue;
        }

        const emailHtml = buildEventReminderEmailHTML(
          user.firstName,
          event.title,
          formattedDate,
          formattedTime,
          event.location || 'GemFitness Tema',
          hoursBeforeEvent,
          booking.ticketId,
          eventId
        );

        if (DEV_MODE) {
          logger.info(`[DEV] Event reminder email would be sent to ${user.email}`);
          sentCount++;
        } else {
          const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [user.email],
            subject: `⏰ Reminder: ${event.title} in ${hoursBeforeEvent} hours`,
            html: emailHtml,
          });

          if (error) {
            errors.push(`Failed to send to ${user.email}: ${error.message}`);
          } else {
            sentCount++;
          }
        }

        // Create notification record
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'EVENT_REMINDER',
            subject: `Reminder: ${event.title}`,
            message: `Your event "${event.title}" starts in ${hoursBeforeEvent} hours on ${formattedDate} at ${formattedTime}.`,
            status: 'sent',
            sentAt: new Date(),
          },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error sending to ${booking.user.email}: ${errorMsg}`);
        logger.error('Error sending event reminder email:', {
          email: booking.user.email,
          error,
        });
      }
    }

    logger.info('Event reminder emails sent:', {
      eventId,
      eventTitle: event.title,
      hoursBeforeEvent,
      sent: sentCount,
      errors: errors.length,
    });

    return {
      success: true,
      recipientCount: sentCount,
      errors,
    };
  } catch (error) {
    logger.error('Error sending event reminder emails:', error);
    throw error;
  }
}

/**
 * Send cancellation email to all registered attendees
 */
export async function sendEventCancellationEmails(
  eventId: string,
  reason: string,
  refundsProcessed: boolean
): Promise<{ success: boolean; recipientCount: number; errors: string[] }> {
  try {
    // Fetch event with bookings
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        bookings: {
          where: {
            status: { in: ['registered', 'confirmed'] },
          },
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

    if (!event) {
      throw new Error('Event not found');
    }

    const errors: string[] = [];
    let sentCount = 0;

    // Format event date
    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Send cancellation emails
    for (const booking of event.bookings) {
      try {
        const user = booking.user;

        // Check notification preferences
        const prefs = user.notificationPreferences;
        if (prefs?.emailEnabled === false) {
          continue;
        }

        const emailHtml = buildEventCancellationEmailHTML(
          user.firstName,
          event.title,
          formattedDate,
          formattedTime,
          reason,
          !event.isFree && refundsProcessed
        );

        if (DEV_MODE) {
          logger.info(`[DEV] Event cancellation email would be sent to ${user.email}`);
          sentCount++;
        } else {
          const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [user.email],
            subject: `❌ Event Cancelled: ${event.title}`,
            html: emailHtml,
          });

          if (error) {
            errors.push(`Failed to send to ${user.email}: ${error.message}`);
          } else {
            sentCount++;
          }
        }

        // Create notification record
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'EVENT_CANCELLED',
            subject: `Event Cancelled: ${event.title}`,
            message: `Unfortunately, "${event.title}" scheduled for ${formattedDate} has been cancelled. ${reason}${!event.isFree && refundsProcessed ? ' Your payment has been refunded.' : ''}`,
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Update booking status
        await prisma.eventBooking.update({
          where: { id: booking.id },
          data: { status: 'cancelled' },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error sending to ${booking.user.email}: ${errorMsg}`);
        logger.error('Error sending event cancellation email:', {
          email: booking.user.email,
          error,
        });
      }
    }

    logger.info('Event cancellation emails sent:', {
      eventId,
      eventTitle: event.title,
      sent: sentCount,
      errors: errors.length,
    });

    return {
      success: true,
      recipientCount: sentCount,
      errors,
    };
  } catch (error) {
    logger.error('Error sending event cancellation emails:', error);
    throw error;
  }
}

/**
 * Build promotional email HTML
 */
function buildEventPromoEmailHTML(
  firstName: string,
  eventTitle: string,
  description: string,
  date: string,
  time: string,
  location: string,
  isFree: boolean,
  price: number | null,
  imageUrl: string | null,
  customMessage: string | undefined,
  eventId: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 60px; margin-bottom: 10px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Exciting Event Coming Up!</h1>
            </td>
          </tr>
          
          ${imageUrl ? `
          <!-- Event Image -->
          <tr>
            <td style="padding: 0;">
              <img src="${imageUrl}" alt="${eventTitle}" style="width: 100%; height: auto; display: block;">
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px;">${eventTitle}</h2>
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Hi ${firstName}! 👋</p>
              
              ${customMessage ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">${customMessage}</p>
              </div>
              ` : ''}
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${description}
              </p>
              
              <!-- Event Details -->
              <div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px;">📅 Event Details</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Date:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">🕒 Time:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Location:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${location}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">💰 Price:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${isFree ? 'FREE' : `GH₵ ${price}`}</td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${APP_URL}/events/${eventId}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Register Now →</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                Accra, Ghana
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Build reminder email HTML
 */
function buildEventReminderEmailHTML(
  firstName: string,
  eventTitle: string,
  date: string,
  time: string,
  location: string,
  hoursBeforeEvent: number,
  ticketId: string | null,
  eventId: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 60px; margin-bottom: 10px;">⏰</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Event Reminder</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your event starts in ${hoursBeforeEvent} hours!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px;">${eventTitle}</h2>
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Hi ${firstName}! 👋</p>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder that your registered event is coming up soon!
              </p>
              
              <!-- Event Details -->
              <div style="background-color: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #78350f; font-size: 16px;">📅 Event Details</h3>
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">📅 Date:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">🕒 Time:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${time}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">📍 Location:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${location}</td>
                  </tr>
                  ${ticketId ? `
                  <tr>
                    <td style="padding: 8px 0; color: #92400e; font-size: 14px;">🎟️ Ticket:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${ticketId}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Pro tip:</strong> Arrive 15 minutes early to check in smoothly!
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${APP_URL}/events/${eventId}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">View Event Details →</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                Accra, Ghana
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Build cancellation email HTML
 */
function buildEventCancellationEmailHTML(
  firstName: string,
  eventTitle: string,
  date: string,
  time: string,
  reason: string,
  refunded: boolean
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 12px 12px 0 0;">
              <div style="font-size: 60px; margin-bottom: 10px;">❌</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Event Cancelled</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 10px; color: #1f2937; font-size: 24px;">${eventTitle}</h2>
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Hi ${firstName},</p>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We regret to inform you that <strong>${eventTitle}</strong> scheduled for <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.
              </p>
              
              <!-- Reason -->
              <div style="background-color: #fee2e2; border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="margin: 0 0 10px; color: #991b1b; font-size: 16px;">Reason for Cancellation:</h3>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">${reason}</p>
              </div>
              
              ${refunded ? `
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  ✅ <strong>Refund Processed:</strong> Your payment has been refunded and will appear in your account within 5-7 business days.
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                We sincerely apologize for any inconvenience this may cause. Please check our events page for other upcoming events you might be interested in!
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${APP_URL}/events" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Browse Other Events →</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
                Accra, Ghana
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
