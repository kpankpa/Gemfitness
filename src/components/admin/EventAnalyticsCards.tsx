'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EventAnalytics {
  summary: {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    totalRegistrations: number;
    averageRegistration: number;
    totalRevenue: number;
    memberRegistrations: number;
    nonMemberRegistrations: number;
  };
  popularEvents: Array<{
    id: string;
    title: string;
    registered: number;
    revenue: number;
  }>;
}

export default function EventAnalyticsCards() {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching event analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const { summary } = analytics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Events */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalEvents}</p>
              <p className="text-xs text-blue-600 mt-1">
                {summary.upcomingEvents} upcoming
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Registrations */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalRegistrations}</p>
              <p className="text-xs text-gray-600 mt-1">
                {summary.memberRegistrations}M / {summary.nonMemberRegistrations}NM
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Revenue */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">GH₵ {summary.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">
                Avg: GH₵ {Math.round(summary.totalRevenue / summary.totalEvents || 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Popular Event */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">Most Popular</p>
              {analytics.popularEvents[0] ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {analytics.popularEvents[0].title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {analytics.popularEvents[0].registered} registered
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-400">No data</p>
              )}
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 ml-2">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
