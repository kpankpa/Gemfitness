'use client';

import { useState, useCallback, useRef } from 'react';
import type { Member } from '@/types';

interface UseMembersReturn {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: (page?: number, limit?: number) => Promise<void>;
  searchMembers: (query: string) => Member[];
  filterByStatus: (status: 'active' | 'expired' | 'expiring_soon') => Member[];
  currentPage: number;
  pageSize: number;
  totalMembers: number;
}

export function useMembers(): UseMembersReturn {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async (page?: number, limit?: number, q?: string, status?: string, plan?: string) => {
    // Prevent duplicate requests
    if (isLoadingRef.current) {
      console.log('⏸️ useMembers: Request already in progress, skipping');
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const p = page && page > 0 ? page : 1;
      const l = limit && limit > 0 ? limit : pageSize;
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', String(l));
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (plan) params.set('plan', plan);
      const url = `/api/members?${params.toString()}`;
      console.log('🔍 Fetching members from:', url);
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Prevent stale data
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Members fetched:', data.members?.length || 0, 'members');

      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members);
        setTotalMembers(typeof data.totalMembers === 'number' ? data.totalMembers : data.members.length);
        setCurrentPage(typeof data.page === 'number' ? data.page : p);
        setPageSize(typeof data.limit === 'number' ? data.limit : l);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      // Don't set error if request was aborted (it's expected)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('⏸️ useMembers: Request cancelled');
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(errorMessage);
      console.error('❌ Error fetching members:', err);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const searchMembers = useCallback((query: string): Member[] => {
    if (!query.trim()) return members;

    const lowercaseQuery = query.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(lowercaseQuery) ||
        member.email.toLowerCase().includes(lowercaseQuery) ||
        member.phone.includes(query) ||
        (member.qrCode && member.qrCode.toLowerCase().includes(lowercaseQuery))
    );
  }, [members]);

  const filterByStatus = useCallback((status: 'active' | 'expired' | 'expiring_soon'): Member[] => {
    return members.filter((member) => member.status === status);
  }, [members]);

  return {
    members,
    isLoading,
    error,
    fetchMembers,
    searchMembers,
    filterByStatus,
    currentPage,
    pageSize,
    totalMembers,
  };
}
