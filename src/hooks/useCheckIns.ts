'use client';

import { useState, useCallback, useRef } from 'react';
import type { CheckIn } from '@/types';

export interface CheckInStats {
  today: number;
  activeNow: number;
  thisWeek: number;
}

interface UseCheckInsReturn {
  checkIns: CheckIn[];
  stats: CheckInStats;
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;
  fetchCheckIns: () => Promise<void>;
  fetchStats: () => Promise<void>;
  performCheckIn: (data: { qrCode?: string; userId?: string; method: 'qr' | 'manual'; checkedBy?: string; forceCheckIn?: boolean }) => Promise<{ success: boolean; error?: string; checkIn?: CheckIn; duplicate?: boolean; message?: string; lastCheckIn?: { time: string; method: string; checkedBy: string } }>;
}

export function useCheckIns(): UseCheckInsReturn {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<CheckInStats>({
    today: 0,
    activeNow: 0,
    thisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const isCheckingInRef = useRef(false);

  const fetchCheckIns = useCallback(async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching check-ins from /api/checkins');
      const response = await fetch('/api/checkins');
      
      if (!response.ok) {
        console.error('❌ Check-ins fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch check-ins: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Check-ins fetched:', data.checkIns?.length || 0);

      if (data.success && Array.isArray(data.checkIns)) {
        setCheckIns(data.checkIns);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch check-ins';
      setError(errorMessage);
      console.error('❌ Error fetching check-ins:', err);
      // Set empty array on error so UI doesn't break
      setCheckIns([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔍 Fetching check-in stats from /api/checkins/stats');
      const response = await fetch('/api/checkins/stats');
      
      if (!response.ok) {
        console.error('❌ Stats fetch failed:', response.status);
        throw new Error('Failed to fetch check-in stats');
      }

      const data = await response.json();
      console.log('✅ Stats fetched:', data);

      if (data.success) {
        setStats({
          today: data.todayCount || 0,
          activeNow: data.activeNow || 0,
          thisWeek: data.weekCount || 0,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching check-in stats:', err);
      // Set default stats on error
      setStats({ today: 0, activeNow: 0, thisWeek: 0 });
    }
  }, []);

  const performCheckIn = useCallback(async (data: { qrCode?: string; userId?: string; method: 'qr' | 'manual'; checkedBy?: string; forceCheckIn?: boolean }) => {
    console.log('🚀 performCheckIn called with data:', data);
    
    if (isCheckingInRef.current) {
      console.log('⏸️ Check-in already in progress, skipping');
      return { success: false, error: 'Check-in already in progress' };
    }

    isCheckingInRef.current = true;
    setIsCheckingIn(true);
    setError(null);
    console.log('✅ Starting check-in process...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ 30-second timeout reached, aborting request');
        controller.abort();
      }, 30000); // Increased to 30 seconds

      console.log('📡 Sending POST request to /api/checkins...');
      console.log('📦 Request body:', JSON.stringify(data));
      
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);
      console.log('📨 Response received:', response.status, response.statusText);

      const result = await response.json();
      console.log('📄 Response body:', result);

      if (response.ok && result.success) {
        console.log('✅ Check-in successful, refreshing data...');
        // Refresh check-ins and stats after successful check-in
        await Promise.all([fetchCheckIns(), fetchStats()]);
        return { success: true, checkIn: result.checkIn };
      } else if (response.status === 409 && result.duplicate) {
        // Duplicate check-in detected
        console.log('⚠️ Duplicate check-in detected:', result.message);
        return { 
          success: false, 
          duplicate: true, 
          message: result.message,
          lastCheckIn: result.lastCheckIn 
        };
      } else {
        console.log('❌ Check-in failed:', result.error);
        return { success: false, error: result.error || 'Check-in failed' };
      }
    } catch (err) {
      console.error('❌ performCheckIn error caught:', err);
      console.error('❌ Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('❌ Error message:', err instanceof Error ? err.message : String(err));
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      console.log('🏁 performCheckIn completed, resetting flags');
      isCheckingInRef.current = false;
      setIsCheckingIn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetchCheckIns and fetchStats are called directly

  return {
    checkIns,
    stats,
    isLoading,
    isCheckingIn,
    error,
    fetchCheckIns,
    fetchStats,
    performCheckIn,
  };
}
