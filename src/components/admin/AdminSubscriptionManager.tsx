'use client';

import { useState } from 'react';
import { Search, Users, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import type { Subscription } from '@/types';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subscriptions: Subscription[];
}

export default function AdminSubscriptionManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError('');
    try {
      const response = await fetch(`/api/members?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members || []);
        if (data.members.length === 0) {
          setError('No members found matching your search');
        }
      } else {
        setError('Failed to search members');
      }
    } catch {
      setError('Failed to search members');
    } finally {
      setSearching(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedMember) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/members/${selectedMember.id}`);
      const data = await response.json();

      if (data.success && data.member) {
        setSelectedMember(data.member);
        // Update in members list too
        setMembers((prev) =>
          prev.map((m) => (m.id === data.member.id ? data.member : m))
        );
      }
    } catch (err) {
      console.error('Failed to refresh member data', err);
    } finally {
      setSearching(false);
    }
  };

  const activeSubscription = selectedMember?.subscriptions?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Member Subscriptions</CardTitle>
          <CardDescription>
            Search for a member to view and manage their subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or phone"
                maxLength={100}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Search Results */}
          {members.length > 0 && !selectedMember && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {members.length} member{members.length !== 1 ? 's' : ''} found
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="w-full p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-sm text-gray-600">{member.phone}</p>
                      </div>
                      <div className="text-right">
                        {member.subscriptions && member.subscriptions.length > 0 ? (
                          <>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                member.subscriptions[0].status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : member.subscriptions[0].status === 'PAUSED'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {member.subscriptions[0].status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {member.subscriptions[0].plan.replace('_', ' ')}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">No subscription</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Member Subscription Management */}
      {selectedMember && activeSubscription && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </CardTitle>
                  <CardDescription>
                    {selectedMember.email} • {selectedMember.phone}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedMember(null);
                    setMembers([]);
                    setSearchQuery('');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Close
                </Button>
              </div>
            </CardHeader>
          </Card>

          <SubscriptionManagement
            subscription={activeSubscription}
            onUpdate={handleRefresh}
            isAdmin={true}
          />
        </div>
      )}

      {selectedMember && !activeSubscription && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">This member does not have an active subscription</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
