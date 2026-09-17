/**
 * DAY PASS API
 * 
 * Lightweight endpoint for selling day passes to walk-in visitors.
 * Much simpler than full walk-in registration:
 * - Minimal info: name + phone + emergency contact
 * - No registration fee
 * - QR code generated for check-in
 * - Subscription auto-expires at end of day (midnight)
 * - If same phone returns, reuses existing user record
 * - Supports Cash + MoMo payment
 * - Late purchase protection (blocked after 11 PM)
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
import { isAdminOrManager } from '@/lib/auth/permissions';
import { PLAN_PRICING } from '@/lib/pricing';
import { generateMemberQRCode } from '@/lib/qr/generator';

// Day pass schema with the required fields.
const dayPassSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  phone: z.string().min(7, 'Phone number required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z.string().min(2, 'Emergency contact name required'),
  emergencyPhone: z.string().min(7, 'Emergency contact phone required'),
  paymentMethod: z.enum(['CASH', 'MOMO']),
  amountPaid: z.union([z.number(), z.string()]).transform(val =>
    typeof val === 'string' ? parseFloat(val) : val
  ).optional(),
});

/**
 * GET /api/day-pass: Get the day pass price from the database or default.
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
 * PUT /api/day-pass: Update the day pass price. Admin only.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdminOrManager(session)) {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
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
 * POST /api/day-pass: Sell a day pass.
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

    // Calculate 30 days ago for usage tracking
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dayPassUsageData = {
      totalPasses: 0,
      last30DaysPasses: 0,
      totalSpent: 0,
      shouldSuggestMembership: false,
      suggestMembershipReason: '',
      potentialSavings: 0,
    };

    if (user) {
      console.log('🔄 Returning visitor:', {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        currentEmail: user.email,
        providedEmail: data.email,
      });
      
      // Check whether the existing user has a DAILY subscription today in any status.
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

      // Track day pass usage history for membership conversion
      const dayPassHistory = await prisma.subscription.findMany({
        where: {
          userId: user.id,
          plan: 'DAILY',
          startDate: { gte: thirtyDaysAgo },
        },
        orderBy: { startDate: 'desc' },
      });

      const allDayPasses = await prisma.subscription.count({
        where: {
          userId: user.id,
          plan: 'DAILY',
        },
      });

      dayPassUsageData.last30DaysPasses = dayPassHistory.length;
      dayPassUsageData.totalPasses = allDayPasses;
      dayPassUsageData.totalSpent = dayPassHistory.reduce((sum, sub) => sum + sub.amount, 0);

      // Get monthly price for comparison
      const monthlyPrice = PLAN_PRICING.ONE_MONTH.price; // 200 GHS

      // Tiered membership suggestions
      if (dayPassUsageData.last30DaysPasses >= 2) {
        // They've bought 3+ day passes (including current purchase)
        const totalIfContinue = (dayPassUsageData.last30DaysPasses + 1) * dayPassPrice;
        
        if (dayPassUsageData.last30DaysPasses >= 4) {
          // 5+ visits in 30 days - strong recommendation
          dayPassUsageData.shouldSuggestMembership = true;
          dayPassUsageData.potentialSavings = totalIfContinue - monthlyPrice;
          dayPassUsageData.suggestMembershipReason = `This will be visit #${dayPassUsageData.last30DaysPasses + 1} this month. A monthly membership (GH₵${monthlyPrice}) would save GH₵${Math.round(dayPassUsageData.potentialSavings)}.`;
        } else if (dayPassUsageData.last30DaysPasses >= 2) {
          // 3-4 visits - soft suggestion
          dayPassUsageData.shouldSuggestMembership = true;
          const potentialMonthlyValue = (30 / (dayPassUsageData.last30DaysPasses + 1)) * dayPassPrice * (dayPassUsageData.last30DaysPasses + 1);
          dayPassUsageData.potentialSavings = potentialMonthlyValue > monthlyPrice ? potentialMonthlyValue - monthlyPrice : 0;
          if (totalIfContinue > monthlyPrice * 0.5) {
            dayPassUsageData.suggestMembershipReason = `This is visit #${dayPassUsageData.last30DaysPasses + 1}. At this rate, a monthly membership (GH₵${monthlyPrice}) offers better value!`;
          } else {
            dayPassUsageData.suggestMembershipReason = `This is visit #${dayPassUsageData.last30DaysPasses + 1}. Consider a monthly membership for unlimited access!`;
          }
        }
      }

      // Check for configurable hard limit (optional)
      const maxDayPassSetting = await prisma.registrationFee.findUnique({
        where: { type: 'MAX_DAY_PASSES_PER_MONTH' },
      });

      if (maxDayPassSetting && maxDayPassSetting.maxMembers && maxDayPassSetting.maxMembers > 0) {
        const maxAllowed = maxDayPassSetting.maxMembers;
        if (dayPassUsageData.last30DaysPasses >= maxAllowed) {
          return NextResponse.json({
            error: 'Day pass limit reached',
            message: `Maximum ${maxAllowed} day passes per month. Please upgrade to a membership for continued access.`,
            limitReached: true,
            usage: dayPassUsageData,
            suggestMembership: true,
          }, { status: 403 });
        }
      }
    } else {
      // Create an account for the new user.
      // Use provided email if valid, otherwise auto-generate placeholder
      const phoneDigits = data.phone.replace(/\D/g, '');
      const providedEmail = data.email?.trim() || '';
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providedEmail);
      const userEmail = isValidEmail ? providedEmail : `daypass_${phoneDigits}@gemfitness.local`;
      
      const autoPassword = `DAYPASS${Math.random().toString(36).slice(-8).toUpperCase()}`;
      const hashedPassword = await hash(autoPassword, 12);

      console.log('👤 Creating new day pass user:', {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: userEmail,
        providedEmail,
        isValidEmail,
      });

      user = await prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: userEmail,
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

    // Late purchase validation - warn if after 8 PM, block if after 11 PM
    const currentHour = now.getHours();
    if (currentHour >= 23) {
      return NextResponse.json({
        error: 'Too late to purchase day pass',
        message: 'Day passes cannot be purchased after 11 PM. Please return tomorrow.',
      }, { status: 400 });
    }
    const isLatePurchase = currentHour >= 20; // After 8 PM

    // Handle payment - wrapped in transaction for atomicity
    if (data.paymentMethod === 'CASH') {
      const cashRef = paystackService.generateReference('DAYPASS');

      // Use transaction to ensure atomicity (subscription + payment + check-in)
      const result = await prisma.$transaction(async (tx) => {
        // Update user info (emergency contact, and email if provided)
        if (user && user.id) {
          const providedEmail = data.email?.trim() || '';
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providedEmail);
          const hasPlaceholderEmail = user.email.includes('@gemfitness.local');
          
          // Update data object
          const updateData: {
            firstName: string;
            lastName: string;
            emergencyContact: string;
            emergencyPhone: string;
            email?: string;
          } = {
            firstName: data.firstName,
            lastName: data.lastName,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
          };
          
          // Only update email if: user has placeholder email AND valid email provided
          // OR if the provided email is different and valid
          if (isValidEmail && (hasPlaceholderEmail || providedEmail !== user.email)) {
            updateData.email = providedEmail;
            console.log('📧 Updating user email from', user.email, 'to', providedEmail);
          }
          
          await tx.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }

        // Generate QR code for day pass user
        const qrData = await generateMemberQRCode();
        await tx.user.update({
          where: { id: user.id },
          data: { qrCode: qrData.token },
        });

        // Create DAILY subscription
        const subscription = await tx.subscription.create({
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
        await tx.payment.create({
          data: {
            subscriptionId: subscription.id,
            amount: amountPaid,
            paymentMethod: 'CASH',
            paymentDate: now,
            reference: cashRef,
            status: 'SUCCESS',
          },
        });

        return { subscription };
      });

      const subscription = result.subscription;

      // Continue transaction flow (outside of $transaction for webhook compatibility)
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
            amountPaid,
            discount: amountPaid !== dayPassPrice ? dayPassPrice - amountPaid : 0,
            processedAt: now.toISOString(),
            staffProcessed: true,
            staffId: session.userId || 'unknown',
            latePurchase: isLatePurchase,
            purchaseHour: currentHour,
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

      // Fetch updated user to ensure we have the latest data
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          emergencyContact: true,
          emergencyPhone: true,
          qrCode: true,
        },
      });

      console.log('✅ Day pass created successfully:', {
        userId: user.id,
        name: `${updatedUser?.firstName} ${updatedUser?.lastName}`,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        reference: cashRef,
      });

      return NextResponse.json({
        success: true,
        payment_method: 'CASH',
        reference: cashRef,
        transactionId: paymentTransaction.id,
        usage: dayPassUsageData,
        dayPass: {
          userId: updatedUser?.id || user.id,
          firstName: updatedUser?.firstName || user.firstName,
          lastName: updatedUser?.lastName || user.lastName,
          phone: updatedUser?.phone || user.phone,
          email: updatedUser?.email || user.email,
          emergencyContact: updatedUser?.emergencyContact,
          emergencyPhone: updatedUser?.emergencyPhone,
          qrCode: updatedUser?.qrCode || '',
          subscriptionId: subscription.id,
          price: dayPassPrice,
          amountPaid,
          expiresAt: endOfDay.toISOString(),
          checkedIn: true,
          latePurchaseWarning: isLatePurchase ? 'Day pass purchased after 8 PM - limited hours remaining' : undefined,
        },
      });
    } else {
      // MOMO payment
      if (!paystackService.isSecretConfigured()) {
        return NextResponse.json({
          error: 'Mobile money payments are not configured',
          message: 'Set PAYSTACK_SECRET_KEY to enable MoMo payments',
        }, { status: 503 });
      }

      // Update user info for returning users
      if (user && user.id) {
        const providedEmail = data.email?.trim() || '';
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providedEmail);
        const hasPlaceholderEmail = user.email.includes('@gemfitness.local');
        
        const updateData: {
          firstName: string;
          lastName: string;
          emergencyContact: string;
          emergencyPhone: string;
          email?: string;
        } = {
          firstName: data.firstName,
          lastName: data.lastName,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
        };
        
        // Update email if valid and either replacing placeholder or changing to new email
        if (isValidEmail && (hasPlaceholderEmail || providedEmail !== user.email)) {
          updateData.email = providedEmail;
          console.log('📧 [MoMo] Updating user email from', user.email, 'to', providedEmail);
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }

      // Get email for payment initialization
      const formEmail = data.email?.trim() || '';
      const emailCandidate = formEmail || user.email || '';
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate);
      const phoneDigits = data.phone.replace(/\D/g, '');
      const autoEmail = isValidEmail
        ? emailCandidate
        : `daypass_${phoneDigits || 'guest'}@gemfitness.com`;
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
              latePurchase: isLatePurchase,
              purchaseHour: currentHour,
              emergencyContact: data.emergencyContact,
              emergencyPhone: data.emergencyPhone,
            },
          },
        });

        // Fetch updated user to get latest email
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { email: true, emergencyContact: true, emergencyPhone: true },
        });

        console.log('✅ MoMo day pass initiated:', {
          userId: user.id,
          name: `${data.firstName} ${data.lastName}`,
          email: updatedUser?.email,
          reference: momoRef,
          provider,
        });

        return NextResponse.json({
          success: true,
          payment_method: 'MOMO',
          reference: momoRef,
          message: 'USSD prompt sent to customer phone',
          status: 'pending',
          provider: provider.toUpperCase(),
          latePurchaseWarning: isLatePurchase ? 'Day pass purchased after 8 PM - limited hours remaining' : undefined,
          usage: dayPassUsageData,
          dayPass: {
            userId: user.id,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: updatedUser?.email || user.email,
            emergencyContact: updatedUser?.emergencyContact,
            emergencyPhone: updatedUser?.emergencyPhone,
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
