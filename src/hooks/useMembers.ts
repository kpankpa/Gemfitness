'use client';

import { useState, useCallback, useRef } from 'react';
import type { Member } from '@/types';

interface UseMembersReturn {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: (limit?: number) => Promise<void>;
  searchMembers: (query: string) => Member[];
  filterByStatus: (status: 'active' | 'expired' | 'expiring_soon') => Member[];
}

export function useMembers(): UseMembersReturn {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async (limit?: number) => {
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
      const url = limit ? `/api/members?limit=${limit}` : '/api/members';
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
  };
}
