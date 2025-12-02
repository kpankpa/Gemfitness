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

  const fetchMembers = useCallback(async (limit?: number) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const url = limit ? `/api/members?limit=${limit}` : '/api/members';
      console.log('🔍 Fetching members from:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      console.log('✅ Members fetched:', data.members?.length || 0, 'members');

      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      setError(errorMessage);
      console.error('❌ Error fetching members:', err);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
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
