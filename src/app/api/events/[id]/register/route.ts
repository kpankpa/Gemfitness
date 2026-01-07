import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';
import { sendEventBookingConfirmation } from '@/lib/services/email/mock';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/[id]/register
 * Register for an event (free or paid)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { userId, paymentMethod } = body; // paymentMethod: "CARD" | "MOMO" | "CASH"

    // Use session userId if not provided
    const targetUserId = userId || session.userId;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ['registered', 'confirmed'] } }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is not cancelled or completed
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: `Cannot register for ${event.status.toLowerCase()} event` 
      }, { status: 400 });
    }

    // Check capacity
    if (event.maxAttendees && event._count.bookings >= event.maxAttendees) {
      return NextResponse.json({ 
        error: 'Event is full' 
      }, { status: 400 });
    }

    // Check if already registered
    const existingBooking = await prisma.eventBooking.findFirst({
      where: {
        userId: targetUserId,
        eventId: eventId,
        status: { in: ['registered', 'confirmed'] }
      }
    });

    if (existingBooking) {
      return NextResponse.json({ 
        error: 'Already registered for this event' 
      }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // FREE EVENT - Instant registration
    if (event.isFree) {
      const ticketQRCode = `EVENT-${event.id}-USER-${targetUserId}-${Date.now()}`;
      
      const booking = await prisma.eventBooking.create({
        data: {
          userId: targetUserId,
          eventId: eventId,
          status: 'confirmed',
          paymentStatus: null, // Free event
          ticketQRData: ticketQRCode,
          ticketGeneratedAt: new Date()
        },
        include: {
          event: {
            select: {
              title: true,
              eventDate: true,
              location: true,
              isFree: true,
              price: true
            }
          }
        }
      });

      // Send confirmation email
      await sendEventBookingConfirmation(user.email, user.firstName, {
        eventTitle: booking.event.title,
        eventDate: booking.event.eventDate.toISOString(),
        location: booking.event.location || 'GemFitness Tema',
        ticketQRCode: ticketQRCode,
        isFree: true
      });

      return NextResponse.json({
        success: true,
        type: 'FREE_EVENT',
        message: 'Successfully registered for event',
        registration: {
          id: booking.id,
          userName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
          eventTitle: booking.event.title,
          eventDate: booking.event.eventDate.toISOString(),
          location: booking.event.location,
          isFree: true,
          ticketQRCode: ticketQRCode,
          status: booking.status
        }
      });
    }

    // PAID EVENT - Initialize payment
    const amount = event.price!;
    
    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method required for paid events' 
      }, { status: 400 });
    }

    // Generate unique reference
    const reference = `EVT-${eventId.substring(0, 8)}-${targetUserId.substring(0, 8)}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store pending booking
    await prisma.pendingEventBooking.create({
      data: {
        userId: targetUserId,
        eventId: eventId,
        paymentReference: reference,
        amount: amount,
        paymentMethod: paymentMethod,
        expiresAt: expiresAt,
        metadata: {
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userPhone: user.phone,
          eventTitle: event.title,
          eventDate: event.eventDate.toISOString()
        }
      }
    });

    // Initialize payment based on method

    if (paymentMethod === 'CARD') {
      // Card payment via Paystack
      const cardPayment = await paystackService.initializeCardPayment(
        user.email,
        amount,
        reference,
        {
          userId: targetUserId,
          eventId: eventId,
          eventTitle: event.title,
          type: 'event_booking'
        }
      );

      return NextResponse.json({
        success: true,
        type: 'PAID_EVENT_CARD',
        message: 'Payment initialized. Redirect customer to complete payment.',
        paymentUrl: cardPayment.authorization_url,
        accessCode: cardPayment.access_code,
        reference: reference,
        amount: amount,
        expiresAt: expiresAt.toISOString()
      });

    } else if (paymentMethod === 'MOMO') {
      // Mobile Money via Paystack
      if (!user.phone) {
        return NextResponse.json({ 
          error: 'Phone number required for Mobile Money payment' 
        }, { status: 400 });
      }

      const momoPayment = await paystackService.initializeMobileMoneyPayment(
        user.email,
        amount,
        user.phone,
        reference,
        {
          userId: targetUserId,
          eventId: eventId,
          eventTitle: event.title,
          type: 'event_booking'
        }
      );

      return NextResponse.json({
        success: true,
        type: 'PAID_EVENT_MOMO',
        message: 'Mobile Money payment initiated. Customer will receive USSD prompt on their phone.',
        reference: reference,
        amount: amount,
        phoneNumber: user.phone,
        provider: momoPayment.provider,
        expiresAt: expiresAt.toISOString(),
        instructions: `USSD prompt sent to ${user.phone}. Customer should dial the code on their phone to authorize payment.`
      });

    } else if (paymentMethod === 'CASH') {
      // Cash payment (staff records payment manually)
      const cashPayment = paystackService.initializeCashPayment(
        amount,
        reference
      );

      return NextResponse.json({
        success: true,
        type: 'PAID_EVENT_CASH',
        message: 'Cash payment recorded. Awaiting staff confirmation.',
        reference: cashPayment.reference,
        amount: cashPayment.amount,
        expiresAt: expiresAt.toISOString(),
        instructions: 'Payment will be confirmed after cash is received and verified by staff.'
      });

    } else {
      return NextResponse.json({ 
        error: 'Invalid payment method. Use CARD, MOMO, or CASH' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/register
 * Cancel event registration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Only allow cancelling your own registration or if you're staff
    if (userId !== session.userId && !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find booking
    const booking = await prisma.eventBooking.findFirst({
      where: {
        userId: userId,
        eventId: eventId,
        status: 'registered'
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'No active registration found' 
      }, { status: 404 });
    }

    // Cancel booking
    await prisma.eventBooking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    return NextResponse.json(
      { error: 'Failed to cancel registration' },
      { status: 500 }
    );
  }
}
