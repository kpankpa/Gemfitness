'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface ClassAnalytics {
  summary: {
    totalClasses: number;
    activeClasses: number;
    totalEnrollments: number;
    averageEnrollment: number;
    totalCapacity: number;
    capacityUtilization: number;
  };
  popularClasses: Array<{
    id: string;
    name: string;
    instructor: string;
    enrolled: number;
    capacity: number;
    utilization: number;
  }>;
}

export default function ClassAnalyticsCards() {
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/classes/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching class analytics:', error);
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
      {/* Total Classes */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalClasses}</p>
              <p className="text-xs text-green-600 mt-1">
                {summary.activeClasses} active
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Enrollments */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Enrollments</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalEnrollments}</p>
              <p className="text-xs text-gray-600 mt-1">
                Avg: {summary.averageEnrollment} per class
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Utilization */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Capacity Utilization</p>
              <p className="text-3xl font-bold text-gray-900">{summary.capacityUtilization}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {summary.totalEnrollments}/{summary.totalCapacity} spots
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Popular */}
      <Card className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 mb-1">Most Popular</p>
              {analytics.popularClasses[0] ? (
                <>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {analytics.popularClasses[0].name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {analytics.popularClasses[0].enrolled} enrolled ({analytics.popularClasses[0].utilization}%)
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
