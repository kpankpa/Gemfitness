/**
 * DAY PASS API
 * 
 * Lightweight endpoint for selling day passes to walk-in visitors.
 * Much simpler than full walk-in registration:
 * - Minimal info: name + phone + emergency contact
 * - No registration fee
 * - No PAR-Q, no QR code, no login password
 * - Subscription auto-expires at end of day (midnight)
 * - If same phone returns, reuses existing user record
 * - Supports Cash + MoMo payment
 * 
 * Endpoints:
 * - POST /api/day-pass - Sell a day pass
 * - GET /api/day-pass - Get day pass settings (price)
 * - PUT /api/day-pass - Update day pass price (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { $Enums } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/auth/permissions';
import { PLAN_PRICING } from '@/lib/pricing';

// Day pass schema — minimal fields
const dayPassSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  phone: z.string().min(7, 'Phone number required'),
  emergencyContact: z.string().min(2, 'Emergency contact name required'),
  emergencyPhone: z.string().min(7, 'Emergency contact phone required'),
  paymentMethod: z.enum(['CASH', 'MOMO']),
  amountPaid: z.union([z.number(), z.string()]).transform(val =>
    typeof val === 'string' ? parseFloat(val) : val
  ).optional(),
});

/**
 * GET /api/day-pass — Get day pass price (from DB or default)
 */
export async function GET() {
  try {
    // Check if there's a DAY_PASS entry in the registration_fees table
    const dayPassFee = await prisma.registrationFee.findUnique({
      where: { type: 'DAY_PASS' },
    });

    const price = dayPassFee?.price ?? PLAN_PRICING.DAILY.price;

    return NextResponse.json({
      success: true,
      price,
      currency: 'GHS',
      name: 'Day Pass',
      description: dayPassFee?.description ?? 'One-day gym access for walk-in visitors',
    });
  } catch (error) {
    console.error('❌ Error fetching day pass price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch day pass price' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/day-pass — Update day pass price (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { price, description } = body;

    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
    }

    // Upsert: create or update the DAY_PASS entry
    const dayPassFee = await prisma.registrationFee.upsert({
      where: { type: 'DAY_PASS' },
      update: {
        price,
        description: description || 'One-day gym access for walk-in visitors',
      },
      create: {
        type: 'DAY_PASS',
        name: 'Day Pass',
        price,
        description: description || 'One-day gym access for walk-in visitors',
        maxMembers: 1,
        status: 'ACTIVE',
        currency: 'GHS',
      },
    });

    return NextResponse.json({ success: true, dayPassFee });
  } catch (error) {
    console.error('❌ Error updating day pass price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update day pass price' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/day-pass — Sell a day pass
 */
export async function POST(request: NextRequest) {
  try {
    // Require staff auth
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = dayPassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: parsed.error.issues,
      }, { status: 400 });
    }

    const data = parsed.data;

    // Validate phone number format (Ghana phone numbers)
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return NextResponse.json({
        error: 'Invalid phone number format',
        details: 'Phone number must be between 9 and 15 digits',
      }, { status: 400 });
    }

    // Get day pass price from DB (or default)
    const dayPassFee = await prisma.registrationFee.findUnique({
      where: { type: 'DAY_PASS' },
    });
    const dayPassPrice = dayPassFee?.price ?? PLAN_PRICING.DAILY.price;
    const amountPaid = data.amountPaid ?? dayPassPrice;

    // Calculate end of day (midnight tonight)
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Check if user with this phone already exists
    let user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (user) {
      // Existing user — check if they already have a DAILY subscription today (any status)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existingDayPass = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          plan: 'DAILY',
          startDate: { gte: todayStart },
        },
        orderBy: { startDate: 'desc' },
      });

      if (existingDayPass) {
        // Check if still valid (not yet midnight)
        const isStillValid = existingDayPass.endDate > now;
        return NextResponse.json({
          error: isStillValid 
            ? `${user.firstName} ${user.lastName} already purchased a day pass today` 
            : 'Day pass already purchased today (expired)',
          duplicate: true,
          existingPass: {
            id: existingDayPass.id,
            expiresAt: existingDayPass.endDate.toISOString(),
            isStillValid,
            status: existingDayPass.status,
          },
        }, { status: 409 });
      }
    } else {
      // New user — create minimal account (no email required, auto-generate)
      const autoEmail = `daypass_${data.phone.replace(/\D/g, '')}@gemfitness.local`;
      const autoPassword = `DAYPASS${Math.random().toString(36).slice(-8).toUpperCase()}`;
      const hashedPassword = await hash(autoPassword, 12);

      user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: autoEmail,
          phone: data.phone,
          password: hashedPassword,
          role: $Enums.UserRole.MEMBER,
          registrationType: $Enums.RegistrationType.WALK_IN,
          registrationPaid: false, // No registration fee for day pass
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          dateOfBirth: new Date('2000-01-01'), // Placeholder for day pass users
          passwordSet: false,
        },
      });
    }

    // Handle payment
    if (data.paymentMethod === 'CASH') {
      const cashRef = paystackService.generateReference('DAYPASS');

      // Create DAILY subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'DAILY',
          amount: dayPassPrice,
          startDate: now,
          endDate: endOfDay,
          status: 'ACTIVE',
          registrationType: $Enums.RegistrationType.WALK_IN,
          renewalStatus: 'NONE', // Day passes don't renew
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: amountPaid,
          paymentMethod: 'CASH',
          paymentDate: now,
          reference: cashRef,
          status: 'SUCCESS',
        },
      });

      // Create payment transaction
      const paymentTransaction = await prisma.paymentTransaction.create({
        data: {
          userId: user.id,
          reference: cashRef,
          amount: amountPaid,
          currency: 'GHS',
          status: 'success',
          paymentMethod: 'cash',
          transactionType: 'day_pass',
          relatedEntityId: subscription.id,
          relatedEntityType: 'subscription',
          metadata: {
            plan: 'DAILY',
            registrationType: 'WALK_IN',
            dayPassPrice,
            processedAt: now.toISOString(),
            staffProcessed: true,
            staffId: session.userId || 'unknown',
          },
          paidAt: now,
        },
      });

      // Send receipt email if user has valid email
      if (!user.email.includes('@gemfitness.local')) {
        try {
          const { sendReceiptEmail } = await import('@/lib/services/email/receipt-email');
          const receiptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/receipt/${paymentTransaction.id}`;
          await sendReceiptEmail({
            memberName: `${user.firstName} ${user.lastName}`,
            memberEmail: user.email,
            transactionId: paymentTransaction.id,
            reference: cashRef,
            amount: amountPaid,
            currency: 'GHS',
            paymentMethod: 'cash',
            plan: 'Day Pass',
            transactionDate: now,
            receiptUrl,
          });
        } catch (emailError) {
          console.error('Failed to send receipt email:', emailError);
          // Don't fail the transaction if email fails
        }
      }

      // Auto check-in the day pass holder
      await prisma.checkIn.create({
        data: {
          userId: user.id,
          checkInTime: now,
          checkedBy: session.userId || null,
          method: 'manual',
          notes: 'Day pass - auto checked in',
        },
      });

      return NextResponse.json({
        success: true,
        payment_method: 'CASH',
        reference: cashRef,
        transactionId: paymentTransaction.id,
        dayPass: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          subscriptionId: subscription.id,
          price: dayPassPrice,
          amountPaid,
          expiresAt: endOfDay.toISOString(),
          checkedIn: true,
        },
      });
    } else {
      // MOMO payment
      const autoEmail = user.email || `daypass_${data.phone.replace(/\D/g, '')}@gemfitness.local`;
      const formattedPhone = paystackService.formatPhoneNumber(data.phone);
      const provider = paystackService.detectMoMoProvider(formattedPhone);

      if (!provider) {
        return NextResponse.json({
          error: 'Invalid mobile money number',
          message: 'Could not detect provider from phone number',
        }, { status: 400 });
      }

      const momoRef = paystackService.generateReference('DAYPASS');

      try {
        await paystackService.initializeMobileMoneyPayment(
          autoEmail,
          dayPassPrice,
          formattedPhone,
          momoRef,
          {
            member_name: `${data.firstName} ${data.lastName}`,
            plan: 'DAILY',
            registration_type: 'WALK_IN',
            transaction_type: 'day_pass',
            staff_id: session.userId || 'unknown',
            user_id: user.id,
          }
        );

        // Store pending day pass data in metadata for webhook to complete
        await prisma.paymentTransaction.create({
          data: {
            userId: user.id,
            reference: momoRef,
            amount: dayPassPrice,
            currency: 'GHS',
            status: 'pending',
            paymentMethod: 'momo',
            transactionType: 'day_pass',
            relatedEntityType: 'day_pass_pending',
            metadata: {
              plan: 'DAILY',
              dayPassPrice,
              phone: data.phone,
              firstName: data.firstName,
              lastName: data.lastName,
              staffId: session.userId || 'unknown',
            },
          },
        });

        return NextResponse.json({
          success: true,
          payment_method: 'MOMO',
          reference: momoRef,
          message: 'USSD prompt sent to customer phone',
          status: 'pending',
          provider: provider.toUpperCase(),
          dayPass: {
            userId: user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            price: dayPassPrice,
          },
        });
      } catch (error) {
        console.error('Day pass MoMo initialization error:', error);
        return NextResponse.json({
          error: 'Payment initialization failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('❌ Day pass error:', error);
    return NextResponse.json(
      { error: 'Failed to process day pass', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
