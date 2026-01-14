'use client';

import { useState, useCallback, useRef } from 'react';
import type { Analytics } from '@/types';

interface UseAnalyticsReturn {
  analytics: Analytics;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    todayCheckIns: 0,
    monthlyRevenue: 0,
    monthlyTransactions: 0,
    recentPayments: [],
    attendanceRate: '0%',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchAnalytics = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics');

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();

      if (data.success) {
        setAnalytics({
          totalMembers: data.totalMembers || 0,
          activeMembers: data.activeMembers || 0,
          expiringSoon: data.expiringSoon || 0,
          todayCheckIns: data.todayCheckIns || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          monthlyTransactions: data.monthlyTransactions || 0,
          recentPayments: data.recentPayments || [],
          attendanceRate: data.attendanceRate || '0%',
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
      
      // Set default values on error
      setAnalytics({
        totalMembers: 0,
        activeMembers: 0,
        expiringSoon: 0,
        todayCheckIns: 0,
        monthlyRevenue: 0,
        monthlyTransactions: 0,
        recentPayments: [],
        attendanceRate: '0%',
      });
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  return {
    analytics,
    isLoading,
    error,
    fetchAnalytics,
  };
}
