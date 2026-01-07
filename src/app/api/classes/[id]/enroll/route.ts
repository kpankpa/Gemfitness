import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';
import { sendClassBookingConfirmation } from '@/lib/services/email/mock';

export const dynamic = 'force-dynamic';

/**
 * POST /api/classes/[id]/enroll
 * Enroll a member in a class (free or paid)
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

    const { id: classId } = await params;
    const body = await request.json();
    const { userId, bookedFor, paymentMethod } = body;

    // Use session userId if not provided (member enrolling themselves)
    const targetUserId = userId || session.userId;

    // Check if class exists and is active
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { 
            bookings: {
              where: { status: 'confirmed' }
            }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classData.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Class is not active' }, { status: 400 });
    }

    // Check capacity
    if (classData._count.bookings >= classData.maxCapacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 });
    }

    // Check if already enrolled
    const existingBooking = await prisma.classBooking.findFirst({
      where: {
        userId: targetUserId,
        classId: classId,
        status: 'confirmed'
      }
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        profileImageGracePeriodEnd: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check profile picture requirement (only for members, not staff)
    if (user.role === 'MEMBER') {
      const hasProfileImage = !!user.profileImage;
      const gracePeriodEnded = user.profileImageGracePeriodEnd
        ? new Date() > new Date(user.profileImageGracePeriodEnd)
        : false;

      if (!hasProfileImage && gracePeriodEnded) {
        return NextResponse.json(
          {
            error: 'Profile picture required',
            message: 'Please upload a profile picture to book classes. Visit your dashboard to complete your profile.',
            requiresProfilePicture: true
          },
          { status: 403 }
        );
      }
    }

    const bookingDate = bookedFor ? new Date(bookedFor) : new Date();

    // FREE CLASS - Instant enrollment (included in membership)
    if (classData.isFree) {
      const booking = await prisma.classBooking.create({
        data: {
          userId: targetUserId,
          classId: classId,
          bookedFor: bookingDate,
          status: 'confirmed',
          paymentStatus: null // Free class
        },
        include: {
          class: {
            select: {
              name: true,
              schedule: true,
              instructor: true
            }
          }
        }
      });

      // Update class current bookings count
      await prisma.class.update({
        where: { id: classId },
        data: {
          currentBookings: {
            increment: 1
          }
        }
      });

      // Send confirmation email
      await sendClassBookingConfirmation(user.email, user.firstName, {
        className: booking.class.name,
        instructor: booking.class.instructor,
        schedule: booking.class.schedule,
        bookedFor: booking.bookedFor.toISOString(),
        isFree: true
      });

      return NextResponse.json({
        success: true,
        type: 'FREE_CLASS',
        message: 'Successfully enrolled in class',
        booking: {
          id: booking.id,
          userName: `${user.firstName} ${user.lastName}`,
          className: booking.class.name,
          schedule: booking.class.schedule,
          instructor: booking.class.instructor,
          bookedFor: booking.bookedFor.toISOString(),
          status: booking.status,
          isFree: true
        }
      });
    }

    // PAID CLASS - Initialize payment
    const amount = classData.price!;
    
    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method required for paid classes' 
      }, { status: 400 });
    }

    // Generate unique reference
    const reference = `CLS-${classId.substring(0, 8)}-${targetUserId.substring(0, 8)}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store pending booking
    await prisma.pendingClassBooking.create({
      data: {
        userId: targetUserId,
        classId: classId,
        bookedFor: bookingDate,
        paymentReference: reference,
        amount: amount,
        paymentMethod: paymentMethod,
        expiresAt: expiresAt,
        metadata: {
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userPhone: user.phone,
          className: classData.name,
          schedule: classData.schedule,
          instructor: classData.instructor
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
          classId: classId,
          className: classData.name,
          type: 'class_booking'
        }
      );

      return NextResponse.json({
        success: true,
        type: 'PAID_CLASS_CARD',
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
          classId: classId,
          className: classData.name,
          type: 'class_booking'
        }
      );

      return NextResponse.json({
        success: true,
        type: 'PAID_CLASS_MOMO',
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
        type: 'PAID_CLASS_CASH',
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
    console.error('Error enrolling in class:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]/enroll
 * Unenroll from a class
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

    const { id: classId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Only allow unenrolling yourself or if you're staff
    if (userId !== session.userId && !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and cancel booking
    const booking = await prisma.classBooking.findFirst({
      where: {
        userId: userId,
        classId: classId,
        status: 'confirmed'
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'No active enrollment found' }, { status: 404 });
    }

    // Update booking status
    await prisma.classBooking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' }
    });

    // Decrement class bookings count
    await prisma.class.update({
      where: { id: classId },
      data: {
        currentBookings: {
          decrement: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from class'
    });
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    return NextResponse.json(
      { error: 'Failed to unenroll from class' },
      { status: 500 }
    );
  }
}
