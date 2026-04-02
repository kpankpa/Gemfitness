/**
 * Subscription Upgrade/Downgrade Service
 * Handles plan changes with proration and credit/charge calculations
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getPlanPricing, MembershipPlan } from '@/lib/pricing';
import { paystackService } from '@/lib/services/paystack';
import { sendUpgradeConfirmationEmail, sendDowngradeConfirmationEmail } from '@/lib/services/email/upgrade-emails';

export interface PlanChangeResult {
  success: boolean;
  message: string;
  oldPlan?: string;
  newPlan?: string;
  proratedAmount?: number; // Positive = charge, negative = credit
  newEndDate?: Date;
  chargeReference?: string;
}

/**
 * Calculate pro-rated amount for plan change
 */
function calculateProration(
  currentPlan: MembershipPlan,
  newPlan: MembershipPlan,
  currentEndDate: Date,
  changeDate: Date = new Date()
): {
  proratedAmount: number;
  daysUsed: number;
  daysRemaining: number;
  creditAmount: number;
  newChargeAmount: number;
} {
  const currentPricing = getPlanPricing(currentPlan);
  const newPricing = getPlanPricing(newPlan);

  // Calculate days remaining in current plan
  const daysRemaining = Math.ceil((currentEndDate.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUsed = currentPricing.durationDays - daysRemaining;

  // Calculate credit for unused portion of current plan
  const dailyRate = currentPricing.price / currentPricing.durationDays;
  const creditAmount = Math.round(daysRemaining * dailyRate);

  // Calculate charge for new plan
  const newChargeAmount = newPricing.price;

  // Net amount to charge/credit
  const proratedAmount = Math.round(newChargeAmount - creditAmount);

  logger.info('Proration calculated:', {
    currentPlan,
    newPlan,
    daysUsed,
    daysRemaining,
    creditAmount,
    newChargeAmount,
    proratedAmount
  });

  return {
    proratedAmount,
    daysUsed,
    daysRemaining,
    creditAmount,
    newChargeAmount
  };
}

/**
 * Upgrade plan to higher tier
 */
export async function upgradePlan(
  subscriptionId: string,
  newPlan: MembershipPlan,
  userId: string,
  reason?: string
): Promise<PlanChangeResult> {
  try {
    // Verify user owns subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    if (subscription.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' };
      }
    }

    // Check if new plan is valid
    const newPricing = getPlanPricing(newPlan);
    if (!newPricing) {
      return { success: false, message: 'Invalid plan' };
    }

    // Verify it's actually an upgrade
    const currentPricing = getPlanPricing(subscription.plan as MembershipPlan);
    if (newPricing.price <= currentPricing.price) {
      return { success: false, message: 'New plan must be higher tier. Use downgrade endpoint for lower tiers.' };
    }

    // Calculate proration
    const now = new Date();
    const proration = calculateProration(
      subscription.plan as MembershipPlan,
      newPlan,
      subscription.endDate,
      now
    );

    let chargeReference = '';
    let newEndDate = subscription.endDate;

    // Charge for upgrade (if amount due > 0)
    if (proration.proratedAmount > 0) {
      const subscriptionWithPayment = subscription;
      
      if (!subscriptionWithPayment.paymentMethodId) {
        return {
          success: false,
          message: 'No payment method on file. Please add a payment method to upgrade.'
        };
      }

      // Attempt to charge the upgrade amount
      try {
        const chargeResult = await paystackService.chargeAuthorization({
          authorization_code: subscriptionWithPayment.paymentMethodId,
          email: subscription.user.email,
          amount: Math.round(proration.proratedAmount * 100),
          reference: `UPGRADE_${subscriptionId}_${Date.now()}`
        });

        if (!chargeResult.status) {
          return {
            success: false,
            message: `Upgrade payment failed: ${chargeResult.message}`
          };
        }

        if (typeof chargeResult.data === 'object' && 'reference' in chargeResult.data) {
          chargeReference = (chargeResult.data as Record<string, string>).reference;
        }
      } catch (error) {
        logger.error('Upgrade charge failed:', {
          subscriptionId,
          error: error instanceof Error ? error.message : String(error)
        });

        return {
          success: false,
          message: 'Payment processing failed. Please try again.'
        };
      }
    }

    // If credit due (rare, plan allows longer duration), extend end date
    if (proration.proratedAmount < 0) {
      const creditDays = Math.ceil(Math.abs(proration.proratedAmount) / (newPricing.price / newPricing.durationDays));
      newEndDate = new Date(subscription.endDate.getTime() + creditDays * 24 * 60 * 60 * 1000);
    }

    // Record the plan change
    await prisma.subscriptionChange.create({
      data: {
        subscriptionId,
        changeType: 'UPGRADE',
        oldPlan: subscription.plan as string,
        newPlan,
        oldPrice: currentPricing.price,
        newPrice: newPricing.price,
        proratedAmount: proration.proratedAmount,
        reason: reason || 'User initiated upgrade',
        initiatedBy: userId
      }
    });

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        plan: newPlan,
        endDate: newEndDate,
        amount: newPricing.price
      }
    });

    logger.info('Subscription upgraded:', {
      subscriptionId,
      oldPlan: subscription.plan,
      newPlan,
      proratedAmount: proration.proratedAmount,
      chargeReference
    });

    // Send confirmation email
    await sendUpgradeConfirmationEmail({
      to: subscription.user.email,
      firstName: subscription.user.firstName,
      oldPlan: subscription.plan,
      newPlan,
      proratedAmount: proration.proratedAmount,
      newEndDate,
      chargeReference: chargeReference || ''
    });

    return {
      success: true,
      message: 'Plan upgraded successfully',
      oldPlan: subscription.plan as string,
      newPlan,
      proratedAmount: proration.proratedAmount,
      newEndDate,
      chargeReference
    };
  } catch (error) {
    logger.error('Plan upgrade error:', {
      subscriptionId,
      newPlan,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      message: 'Failed to upgrade plan'
    };
  }
}

/**
 * Downgrade plan to lower tier
 */
export async function downgradePlan(
  subscriptionId: string,
  newPlan: MembershipPlan,
  userId: string,
  reason?: string
): Promise<PlanChangeResult> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });

    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    if (subscription.userId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' };
      }
    }

    const newPricing = getPlanPricing(newPlan);
    if (!newPricing) {
      return { success: false, message: 'Invalid plan' };
    }

    const currentPricing = getPlanPricing(subscription.plan as MembershipPlan);
    if (newPricing.price >= currentPricing.price) {
      return { success: false, message: 'New plan must be lower tier. Use upgrade endpoint for higher tiers.' };
    }

    // Calculate proration
    const now = new Date();
    const proration = calculateProration(
      subscription.plan as MembershipPlan,
      newPlan,
      subscription.endDate,
      now
    );

    // For downgrades, we typically apply credit to end date for unused portion
    const creditAmount = Math.abs(proration.proratedAmount);
    const creditDays = Math.ceil(creditAmount / (newPricing.price / newPricing.durationDays));
    const newEndDate = new Date(subscription.endDate.getTime() + creditDays * 24 * 60 * 60 * 1000);

    // Record the downgrade
    await prisma.subscriptionChange.create({
      data: {
        subscriptionId,
        changeType: 'DOWNGRADE',
        oldPlan: subscription.plan as string,
        newPlan,
        oldPrice: currentPricing.price,
        newPrice: newPricing.price,
        proratedAmount: -creditAmount, // Negative = credit
        reason: reason || 'User initiated downgrade',
        initiatedBy: userId
      }
    });

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        plan: newPlan,
        amount: newPricing.price,
        endDate: newEndDate
      }
    });

    logger.info('Subscription downgraded:', {
      subscriptionId,
      oldPlan: subscription.plan,
      newPlan,
      creditAmount,
      newEndDate
    });

    // Send confirmation email
    await sendDowngradeConfirmationEmail({
      to: subscription.user.email,
      firstName: subscription.user.firstName,
      oldPlan: subscription.plan,
      newPlan,
      creditAmount,
      newEndDate
    });

    return {
      success: true,
      message: 'Plan downgraded successfully',
      oldPlan: subscription.plan as string,
      newPlan,
      proratedAmount: -creditAmount,
      newEndDate
    };
  } catch (error) {
    logger.error('Plan downgrade error:', {
      subscriptionId,
      newPlan,
      error: error instanceof Error ? error.message : String(error)
    });

    return {
      success: false,
      message: 'Failed to downgrade plan'
    };
  }
}

/**
 * Preview plan change cost
 */
export function previewPlanChange(
  currentPlan: MembershipPlan,
  newPlan: MembershipPlan,
  currentEndDate: Date
): {
  currentPrice: number;
  newPrice: number;
  proratedAmount: number;
  creditAmount: number;
  message: string;
} {
  const currentPricing = getPlanPricing(currentPlan);
  const newPricing = getPlanPricing(newPlan);
  const proration = calculateProration(currentPlan, newPlan, currentEndDate);

  let message = '';
  if (proration.proratedAmount > 0) {
    message = `You'll be charged GH₵${proration.proratedAmount.toFixed(2)} for the upgrade`;
  } else if (proration.proratedAmount < 0) {
    message = `You'll receive a credit of GH₵${Math.abs(proration.proratedAmount).toFixed(2)}`;
  } else {
    message = 'No additional charge for this plan change';
  }

  return {
    currentPrice: currentPricing.price,
    newPrice: newPricing.price,
    proratedAmount: proration.proratedAmount,
    creditAmount: proration.creditAmount,
    message
  };
}

