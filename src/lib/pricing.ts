/**
 * Pricing utilities for membership plans
 * Centralized source of truth for membership prices and durations
 */

export const PLAN_PRICING = {
  DAILY: {
    price: 30, // GH₵ (default, can be overridden from DB)
    durationDays: 1,
    name: 'Day Pass',
  },
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
 * Calculate subscription end date from duration
 */
export function calculateEndDate(durationDays: number): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

