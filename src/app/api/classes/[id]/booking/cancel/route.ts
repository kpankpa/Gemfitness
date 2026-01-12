import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { sendEmail } from '@/lib/services/email/mock';

/**
 * POST /api/classes/[id]/booking/cancel - Member cancels their own booking
 * Includes auto-promotion from waitlist with 2-hour claim window
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: classId } = await params;
    const userId = session.userId!;

    // Find the booking
    const booking = await prisma.classBooking.findFirst({
      where: {
        userId,
        classId,
        status: 'confirmed',
      },
      include: {
        class: {
          select: {
            name: true,
            schedule: true,
            instructor: true,
            isFree: true,
            price: true,
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if class has already happened
    const classDate = new Date(booking.bookedFor);
    const now = new Date();
    
    if (classDate < now) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel past classes' },
        { status: 400 }
      );
    }

    // Cancel the booking
    await prisma.classBooking.update({
      where: { id: booking.id },
      data: { 
        status: 'cancelled',
      },
    });

    // Send cancellation confirmation email
    await sendEmail({
      to: booking.user.email,
      subject: 'Class Booking Cancelled - GemFitness',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Booking Cancelled</h2>
          <p>Hi ${booking.user.firstName},</p>
          <p>Your booking for <strong>${booking.class.name}</strong> has been cancelled.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Class:</strong> ${booking.class.name}</p>
            <p><strong>Instructor:</strong> ${booking.class.instructor}</p>
            <p><strong>Date:</strong> ${classDate.toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          ${booking.amountPaid ? `
            <p style="color: #059669; font-weight: bold;">
              Note: For paid classes, please contact reception about refund options.
            </p>
          ` : ''}
          <p>You can book another class anytime from your dashboard.</p>
        </div>
      `,
    });

    // AUTO-PROMOTION: Check waitlist and promote next person
    const nextInWaitlist = await prisma.waitlist.findFirst({
      where: {
        classId,
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
        class: {
          select: {
            name: true,
            instructor: true,
            schedule: true,
            isFree: true,
            price: true,
          },
        },
      },
    });

    let promotedUser = null;

    if (nextInWaitlist) {
      // Set 2-hour claim window
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

      // Send notification email with claim link
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
                A spot has become available for <strong>${nextInWaitlist.class.name}</strong>!
              </p>

              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                <h3 style="margin: 0 0 10px 0; color: #111827;">Class Details</h3>
                <p style="margin: 5px 0;"><strong>Class:</strong> ${nextInWaitlist.class.name}</p>
                <p style="margin: 5px 0;"><strong>Instructor:</strong> ${nextInWaitlist.class.instructor}</p>
                <p style="margin: 5px 0;"><strong>Schedule:</strong> ${nextInWaitlist.class.schedule}</p>
                ${!nextInWaitlist.class.isFree ? `
                  <p style="margin: 5px 0;"><strong>Price:</strong> GH₵${nextInWaitlist.class.price}</p>
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
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/classes/${classId}/claim?waitlistId=${nextInWaitlist.id}" 
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

      promotedUser = {
        userId: nextInWaitlist.user.id,
        email: nextInWaitlist.user.email,
        name: `${nextInWaitlist.user.firstName} ${nextInWaitlist.user.lastName}`,
        position: nextInWaitlist.position,
        expiresAt: claimExpiry.toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        className: booking.class.name,
        cancelledAt: now.toISOString(),
      },
      waitlistPromotion: promotedUser ? {
        promoted: true,
        nextUser: promotedUser,
      } : {
        promoted: false,
        message: 'No one on waitlist',
      },
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
