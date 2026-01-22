/**
 * Pricing utilities for membership plans
 * Centralized source of truth for membership prices and durations
 */

export const PLAN_PRICING = {
  ONE_MONTH: {
    price: 200, // GH₵
    durationDays: 30,
    name: 'Monthly Plan',
  },
  THREE_MONTHS: {
    price: 500, // GH₵
    durationDays: 90,
    name: 'Quarterly Plan',
  },
  ONE_YEAR: {
    price: 2200, // GH₵
    durationDays: 365,
    name: 'Annual Plan',
  },
} as const;

export type MembershipPlan = keyof typeof PLAN_PRICING;

/**
 * Get pricing info for a plan
 */
export function getPlanPricing(plan: MembershipPlan) {
  return PLAN_PRICING[plan];
}

/**
 * Map payment amount (in cedis) to membership plan
 * Used when payment metadata doesn't specify the plan
 */
export function determinePlanFromAmount(amountInCedis: number): MembershipPlan {
  if (amountInCedis >= PLAN_PRICING.ONE_YEAR.price - 50) {
    return 'ONE_YEAR';
  } else if (amountInCedis >= PLAN_PRICING.THREE_MONTHS.price - 50) {
    return 'THREE_MONTHS';
  }
  return 'ONE_MONTH';
}

/**
 * Calculate subscription end date from duration
 */
export function calculateEndDate(durationDays: number): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

/**
 * Validate payment amount matches plan
 */
export function validatePaymentAmount(
  amountInCedis: number,
  expectedPlan: MembershipPlan,
  tolerance = 100 // Allow ±100 cedis tolerance for rounding
): boolean {
  const expectedPrice = PLAN_PRICING[expectedPlan].price;
  return Math.abs(amountInCedis - expectedPrice) <= tolerance;
}
