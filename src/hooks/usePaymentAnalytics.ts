// Payment Analytics Hook
// src/hooks/usePaymentAnalytics.ts

'use client';

import { useState, useCallback, useRef } from 'react';

export interface PaymentMethodBreakdown {
  method: string;
  revenue: number;
  transactions: number;
  percentage: number;
}

export interface PaymentAnalytics {
  paymentMethodBreakdown: PaymentMethodBreakdown[];
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  paymentSuccessRate: number;
  totalRevenue: number;
  revenueTrends: Array<{
    month: Date;
    revenue: number;
    transactions: number;
  }>;
  outstandingPayments: number;
  outstandingAmount: number;
}

interface UsePaymentAnalyticsReturn {
  paymentAnalytics: PaymentAnalytics;
  isLoading: boolean;
  error: string | null;
  fetchPaymentAnalytics: (period?: string) => Promise<void>;
}

export function usePaymentAnalytics(): UsePaymentAnalyticsReturn {
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics>({
    paymentMethodBreakdown: [],
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    paymentSuccessRate: 0,
    totalRevenue: 0,
    revenueTrends: [],
    outstandingPayments: 0,
    outstandingAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchPaymentAnalytics = useCallback(async (period: string = '30') => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/analytics?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics');
      }

      const data = await response.json();

      if (data.success) {
        setPaymentAnalytics(data.analytics);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment analytics';
      setError(errorMessage);
      console.error('Error fetching payment analytics:', err);
      
      // Set default values on error
      setPaymentAnalytics({
        paymentMethodBreakdown: [],
        monthlyRecurringRevenue: 0,
        annualRecurringRevenue: 0,
        paymentSuccessRate: 0,
        totalRevenue: 0,
        revenueTrends: [],
        outstandingPayments: 0,
        outstandingAmount: 0,
      });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  return {
    paymentAnalytics,
    isLoading,
    error,
    fetchPaymentAnalytics,
  };
}