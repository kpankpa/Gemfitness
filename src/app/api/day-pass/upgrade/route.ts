/**
 * DAY PASS UPGRADE API
 * 
 * Converts day pass users to full members:
 * - Collect additional required info (password, PAR-Q, etc.)
 * - Upgrade user role from day pass user to MEMBER
 * - Migrate subscription from DAILY to selected plan
 * - Keep QR code and check-in history
 * - Track conversion in payment metadata
 * - Pay FULL membership price (no credit/discount)
 * 
 * Endpoints:
 * - GET /api/day-pass/upgrade?userId=xxx - Get user info and plan prices
 * - POST /api/day-pass/upgrade - Process upgrade with payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { PLAN_PRICING } from '@/lib/pricing';

/**
 * GET /api/day-pass/upgrade?userId=xxx
 * Get user info and available plans for upgrade
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role as string)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user with their subscriptions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active non-DAILY subscription (already a full member)
    const hasActiveFullMembership = user.subscriptions.some(
      (sub) => sub.plan !== 'DAILY' && sub.status === 'ACTIVE'
    );
    if (hasActiveFullMembership) {
      return NextResponse.json({
        error: 'Already a full member',
        message: 'This user already has an active membership',
        isAlreadyMember: true,
      }, { status: 400 });
    }

    // Check if email is placeholder (needs to be collected)
    const hasPlaceholderEmail = user.email.includes('@gemfitness.local');
    // Check if dateOfBirth is placeholder
    const hasPlaceholderDOB = user.dateOfBirth.toISOString().startsWith('2000-01-01');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: hasPlaceholderEmail ? '' : user.email,
        phone: user.phone,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        address: user.address || '',
        dateOfBirth: hasPlaceholderDOB ? '' : user.dateOfBirth.toISOString().split('T')[0],
      },
      needsEmail: hasPlaceholderEmail,
      needsDateOfBirth: hasPlaceholderDOB,
      plans: {
        ONE_MONTH: PLAN_PRICING.ONE_MONTH,
        THREE_MONTHS: PLAN_PRICING.THREE_MONTHS,
        ONE_YEAR: PLAN_PRICING.ONE_YEAR,
      },
    });
  } catch (error) {
    console.error('Error fetching upgrade info:', error);
    return NextResponse.json({ error: 'Failed to fetch upgrade info' }, { status: 500 });
  }
}

/**
 * POST /api/day-pass/upgrade
 * Process upgrade from day pass to full membership
 */
const upgradeSchema = z.object({
  userId: z.string().min(1, 'User ID required'),
  plan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  // Required member info
  email: z.string().email('Valid email is required').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  emergencyContact: z.string().min(2, 'Emergency contact name required').optional(),
  emergencyPhone: z.string().min(7, 'Emergency contact phone required').optional(),
  // Optional extra info
  address: z.string().optional(),
  fitnessGoals: z.string().optional(),
  medicalConditions: z.string().optional(),
  // PAR-Q fields
  hasHeartCondition: z.boolean().default(false),
  hasChestPain: z.boolean().default(false),
  hasDizziness: z.boolean().default(false),
  hasJointProblems: z.boolean().default(false),
  takesMedication: z.boolean().default(false),
  hasOtherConditions: z.boolean().default(false),
  otherConditionsDetails: z.string().optional(),
  // Payment
  paymentMethod: z.enum(['CASH', 'MOMO', 'CARD']),
  amountPaid: z.number().positive('Amount must be positive'),
  momoReference: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role as string)) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
    }

    const body = await request.json();
    const data = upgradeSchema.parse(body);

    // Get user and validate eligibility
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: {
        subscriptions: {
          where: { plan: 'DAILY' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const selectedPlan = PLAN_PRICING[data.plan];
    const expectedAmount = selectedPlan.price;

    // Validate payment amount (allow small variance for rounding)
    if (Math.abs(data.amountPaid - expectedAmount) > 1) {
      return NextResponse.json({
        error: 'Invalid payment amount',
        message: `Expected GH₵${expectedAmount}, but received GH₵${data.amountPaid}`,
        expected: expectedAmount,
        received: data.amountPaid,
      }, { status: 400 });
    }

    // Calculate PAR-Q risk level
    const riskFactors = [
      data.hasHeartCondition,
      data.hasChestPain,
      data.hasDizziness,
      data.hasJointProblems,
      data.takesMedication,
      data.hasOtherConditions,
    ].filter(Boolean).length;

    let parqRiskLevel = 'low';
    if (riskFactors >= 3) parqRiskLevel = 'high';
    else if (riskFactors >= 1) parqRiskLevel = 'medium';

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + selectedPlan.durationDays);

    // Process upgrade in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user to MEMBER role with additional info
      // Determine email: use provided email if current is placeholder, otherwise keep existing
      const currentEmailIsPlaceholder = user.email.includes('@gemfitness.local');
      const newEmail = data.email && currentEmailIsPlaceholder ? data.email : user.email;

      const updatedUser = await tx.user.update({
        where: { id: data.userId },
        data: {
          role: 'MEMBER',
          email: newEmail,
          password: hashedPassword,
          passwordSet: true,
          registrationType: 'WALK_IN',
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address || user.address,
          emergencyContact: data.emergencyContact || user.emergencyContact,
          emergencyPhone: data.emergencyPhone || user.emergencyPhone,
          fitnessGoals: data.fitnessGoals || user.fitnessGoals,
          medicalConditions: data.medicalConditions || user.medicalConditions,
          parqCompleted: true,
          parqCompletedAt: now,
          parqRiskLevel,
          registrationPaid: true, // Mark registration as paid (waived as part of upgrade)
        },
      });

      // 2. Expire old DAILY subscriptions
      await tx.subscription.updateMany({
        where: {
          userId: data.userId,
          plan: 'DAILY',
          status: 'ACTIVE',
        },
        data: {
          status: 'EXPIRED',
          endDate: now, // End immediately
        },
      });

      // 3. Create new membership subscription
      const newSubscription = await tx.subscription.create({
        data: {
          userId: data.userId,
          plan: data.plan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          amount: selectedPlan.price,
          registrationType: 'WALK_IN',
          renewalStatus: 'PENDING',
        },
      });

      // 4. Create payment transaction
      const paymentRef = `UPG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      const paymentTransaction = await tx.paymentTransaction.create({
        data: {
          reference: paymentRef,
          amount: data.amountPaid,
          currency: 'GHS',
          status: 'success',
          paymentMethod: data.paymentMethod.toLowerCase(),
          transactionType: 'SUBSCRIPTION',
          userId: data.userId,
          relatedEntityId: newSubscription.id,
          relatedEntityType: 'subscription',
          metadata: {
            convertedFromDayPass: true,
            upgradedToPlan: data.plan,
            processedBy: session.userId,
            processedAt: now.toISOString(),
            momoReference: data.momoReference,
          },
          paidAt: now,
        },
      });

      // 5. Create PAR-Q response record
      await tx.parQResponse.create({
        data: {
          userId: data.userId,
          responses: JSON.stringify({
            hasHeartCondition: data.hasHeartCondition,
            hasChestPain: data.hasChestPain,
            hasDizziness: data.hasDizziness,
            hasJointProblems: data.hasJointProblems,
            takesMedication: data.takesMedication,
            hasOtherConditions: data.hasOtherConditions,
          }),
          otherReasonDetails: data.otherConditionsDetails || '',
          riskLevel: parqRiskLevel.toUpperCase(),
          completedAt: now,
        },
      });

      return {
        user: updatedUser,
        subscription: newSubscription,
        payment: paymentTransaction,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${selectedPlan.name}`,
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        qrCode: result.user.qrCode,
      },
      subscription: {
        id: result.subscription.id,
        plan: result.subscription.plan,
        planName: selectedPlan.name,
        startDate: result.subscription.startDate,
        endDate: result.subscription.endDate,
        duration: `${selectedPlan.durationDays} days`,
      },
      payment: {
        reference: result.payment.reference,
        amount: result.payment.amount,
        method: data.paymentMethod,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`),
      }, { status: 400 });
    }

    console.error('Error processing upgrade:', error);
    return NextResponse.json({ error: 'Failed to process upgrade' }, { status: 500 });
  }
}
