import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email/mock';

/**
 * GET /api/cron/process-waitlist - Process expired waitlist notifications
 * - Marks expired notifications
 * - Promotes next person in line
 * Run every 15 minutes
 */
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
    let processedCount = 0;
    let promotedCount = 0;

    // Find all expired 'notified' waitlist entries
    const expiredEntries = await prisma.waitlist.findMany({
      where: {
        status: 'notified',
        expiresAt: {
          lte: now,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            schedule: true,
            instructor: true,
            maxCapacity: true,
            isFree: true,
            price: true,
            _count: {
              select: {
                bookings: {
                  where: {
                    status: 'confirmed',
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    for (const expiredEntry of expiredEntries) {
      // Mark as expired
      await prisma.waitlist.update({
        where: { id: expiredEntry.id },
        data: { status: 'expired' },
      });

      processedCount++;

      // Notify user that their claim window expired
      await sendEmail({
        to: expiredEntry.user.email,
        subject: 'Waitlist Claim Expired - GemFitness',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Claim Window Expired</h2>
            <p>Hi ${expiredEntry.user.firstName},</p>
            <p>Unfortunately, your 2-hour claim window for <strong>${expiredEntry.class.name}</strong> has expired.</p>
            <p>The spot has been offered to the next person on the waitlist.</p>
            <p>You can rejoin the waitlist or check for other available classes.</p>
          </div>
        `,
      });

      // Check if class still has capacity
      const currentBookings = expiredEntry.class._count.bookings;
      if (currentBookings >= expiredEntry.class.maxCapacity) {
        // Class is full, skip promotion
        continue;
      }

      // Promote next person in waitlist
      const nextInWaitlist = await prisma.waitlist.findFirst({
        where: {
          classId: expiredEntry.classId,
          status: 'waiting',
        },
        orderBy: {
          position: 'asc',
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
        },
      });

      if (nextInWaitlist) {
        // Set new 2-hour claim window
        const claimExpiry = new Date();
        claimExpiry.setHours(claimExpiry.getHours() + 2);

        // Update waitlist status to 'notified'
        await prisma.waitlist.update({
          where: { id: nextInWaitlist.id },
          data: {
            status: 'notified',
            notifiedAt: now,
            expiresAt: claimExpiry,
          },
        });

        promotedCount++;

        // Send notification email
        await sendEmail({
          to: nextInWaitlist.user.email,
          subject: '🎉 Spot Available - Class Waitlist - GemFitness',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎉 Great News!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">A spot just opened up</p>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #111827; margin-top: 0;">Hi ${nextInWaitlist.user.firstName},</p>
                
                <p style="font-size: 16px; color: #111827;">
                  A spot has become available for <strong>${expiredEntry.class.name}</strong>!
                </p>

                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                  <h3 style="margin: 0 0 10px 0; color: #111827;">Class Details</h3>
                  <p style="margin: 5px 0;"><strong>Class:</strong> ${expiredEntry.class.name}</p>
                  <p style="margin: 5px 0;"><strong>Instructor:</strong> ${expiredEntry.class.instructor}</p>
                  <p style="margin: 5px 0;"><strong>Schedule:</strong> ${expiredEntry.class.schedule}</p>
                  ${!expiredEntry.class.isFree ? `
                    <p style="margin: 5px 0;"><strong>Price:</strong> GH₵${expiredEntry.class.price}</p>
                  ` : ''}
                </div>

                <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-weight: bold;">⏰ Time-Limited Offer</p>
                  <p style="margin: 5px 0 0 0; color: #78350f;">
                    You have <strong>2 hours</strong> to claim this spot. 
                    Expires at ${claimExpiry.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/classes/${expiredEntry.classId}/claim?waitlistId=${nextInWaitlist.id}" 
                     style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Claim Your Spot Now
                  </a>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                  If you don't claim within 2 hours, the spot will be offered to the next person on the waitlist.
                </p>
              </div>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Waitlist processing completed',
      stats: {
        expiredEntries: processedCount,
        newPromotions: promotedCount,
        timestamp: now.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error processing waitlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process waitlist' },
      { status: 500 }
    );
  }
}
