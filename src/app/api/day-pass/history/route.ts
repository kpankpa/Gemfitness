/**
 * DAY PASS HISTORY API
 * Quick lookup endpoint for checking repeat visitor status
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLAN_PRICING } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');

    if (!userId && !phone) {
      return NextResponse.json({
        error: 'userId or phone required',
      }, { status: 400 });
    }

    // Find user by ID or phone
    const user = userId 
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { phone: phone! } });

    if (!user) {
      return NextResponse.json({
        success: true,
        usage: null,
        isNewVisitor: true,
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get day pass history
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

    const dayPassPrice = PLAN_PRICING.DAILY.price;
    const monthlyPrice = PLAN_PRICING.ONE_MONTH.price;

    const totalSpent = dayPassHistory.reduce((sum, sub) => sum + sub.amount, 0);
    const last30DaysPasses = dayPassHistory.length;

    let shouldSuggestMembership = false;
    let suggestMembershipReason = '';
    let potentialSavings = 0;

    // Calculate membership suggestions
    if (last30DaysPasses >= 2) {
      const totalIfContinue = (last30DaysPasses + 1) * dayPassPrice;
      
      if (last30DaysPasses >= 4) {
        shouldSuggestMembership = true;
        potentialSavings = totalIfContinue - monthlyPrice;
        suggestMembershipReason = `This will be visit #${last30DaysPasses + 1} this month. A monthly membership (GH₵${monthlyPrice}) would save GH₵${Math.round(potentialSavings)}.`;
      } else if (last30DaysPasses >= 2) {
        shouldSuggestMembership = true;
        if (totalIfContinue > monthlyPrice * 0.5) {
          suggestMembershipReason = `This is visit #${last30DaysPasses + 1}. At this rate, a monthly membership (GH₵${monthlyPrice}) offers better value!`;
        } else {
          suggestMembershipReason = `This is visit #${last30DaysPasses + 1}. Consider a monthly membership for unlimited access!`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      isNewVisitor: false,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      usage: {
        totalPasses: allDayPasses,
        last30DaysPasses,
        totalSpent,
        shouldSuggestMembership,
        suggestMembershipReason,
        potentialSavings,
      },
    });
  } catch (error) {
    console.error('❌ Day pass history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day pass history' },
      { status: 500 }
    );
  }
}
