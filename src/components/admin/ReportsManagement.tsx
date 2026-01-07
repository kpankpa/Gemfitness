'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  DollarSign,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Base types for different report responses
interface RevenueReportData {
  summary: {
    totalRevenue: number;
    subscriptionRevenue: number;
    registrationRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
  };
  breakdown: {
    byPlan: Array<{
      plan: string;
      revenue: number;
      percentage: string;
    }>;
    daily: Array<{
      date: string;
      revenue: number;
    }>;
  };
  transactions: Array<{
    date: Date;
    member: string;
    email: string;
    type: string;
    plan: string;
    amount: number;
    status: string;
  }>;
}

interface AttendanceReportData {
  summary: {
    totalCheckIns: number;
    uniqueMembers: number;
    averagePerDay: number;
    peakDay: [string, number];
  };
  breakdown: {
    byMember: Array<{
      memberId: string;
      memberName: string;
      email: string;
      count: number;
      lastCheckIn: Date;
    }>;
    daily: Array<{
      date: string;
      count: number;
    }>;
    hourly: Array<{
      hour: string;
      count: number;
    }>;
  };
}

interface GrowthReportData {
  summary: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    newMembersThisPeriod: number;
    growthRate: number;
    retentionRate: number;
  };
  breakdown: {
    monthly: Array<{
      month: string;
      newMembers: number;
      totalMembers: number;
      growthRate: number;
    }>;
    membershipPlans: Array<{
      plan: string;
      count: number;
      percentage: string;
    }>;
  };
}

interface SummaryReportData {
  revenue: RevenueReportData;
  attendance: AttendanceReportData;
  growth: GrowthReportData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReportData = RevenueReportData | AttendanceReportData | GrowthReportData | SummaryReportData | any;

export default function ReportsManagement() {
  const [reportType, setReportType] = useState<'revenue' | 'attendance' | 'growth' | 'summary'>('summary');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.report);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange]);

  const exportReport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          reportData
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive business insights and data exports</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => exportReport('csv')}
            variant="outline"
            className="gap-2"
            disabled={!reportData}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => exportReport('excel')}
            variant="outline"
            className="gap-2"
            disabled={!reportData}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'attendance', label: 'Attendance', icon: Activity },
          { id: 'growth', label: 'Member Growth', icon: Users }
        ].map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as typeof reportType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                reportType === type.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2'
              }`}
            >
              <Icon className="h-4 w-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setDateRange({
                  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
                  endDate: new Date().toISOString().slice(0, 10)
                })}
                variant="outline"
              >
                This Month
              </Button>
              <Button
                onClick={() => setDateRange({
                  startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
                  endDate: new Date().toISOString().slice(0, 10)
                })}
                variant="outline"
              >
                This Year
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading report data...</p>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && reportData && (
        <>
          {reportType === 'summary' && <SummaryReport data={reportData} />}
          {reportType === 'revenue' && <RevenueReport data={reportData} />}
          {reportType === 'attendance' && <AttendanceReport data={reportData} />}
          {reportType === 'growth' && <GrowthReport data={reportData} />}
        </>
      )}
    </div>
  );
}

function SummaryReport({ data }: { data: ReportData }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-green-700 mt-1">
                  GH₵ {data.revenue?.summary?.totalRevenue?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.revenue?.summary?.totalTransactions || 0} transactions</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Check-Ins</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {data.attendance?.summary?.totalCheckIns?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.attendance?.summary?.uniqueMembers || 0} unique members</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Members</p>
                <p className="text-3xl font-bold text-purple-700 mt-1">
                  {data.growth?.summary?.activeMembers?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.growth?.summary?.retentionRate?.toFixed(1) || 0}% retention</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RevenueReport({ data }: { data: ReportData }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              GH₵ {data.summary?.totalRevenue?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.summary?.totalTransactions?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Average Transaction</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              GH₵ {data.summary?.averageTransaction?.toFixed(2) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      {data.trends?.monthly && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trends.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} name="Revenue (GH₵)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.breakdown?.byMethod && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={data.breakdown.byMethod}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {data.breakdown.byMethod.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.breakdown?.byPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.breakdown.byPlan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Revenue (GH₵)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AttendanceReport({ data }: { data: ReportData }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Total Check-Ins</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.summary?.totalCheckIns?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Unique Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.summary?.uniqueMembers?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Average Per Day</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.summary?.averagePerDay?.toFixed(1) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Chart */}
      {data.trends?.daily && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Check-ins per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.trends.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Members */}
      {data.breakdown?.topMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Most Active Members</CardTitle>
            <CardDescription>Top 10 members by check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.breakdown.topMembers.slice(0, 10).map((member: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{member.count}</p>
                    <p className="text-xs text-gray-500">check-ins</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GrowthReport({ data }: { data: GrowthReportData }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Total Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.summary?.totalMembers?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Active Members</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {data.summary?.activeMembers?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Inactive Members</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {data.summary?.inactiveMembers?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 font-medium">Retention Rate</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {data.summary?.retentionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trend Chart */}
      {data.breakdown?.monthly && (
        <Card>
          <CardHeader>
            <CardTitle>Member Growth Trend</CardTitle>
            <CardDescription>New and total members over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.breakdown.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newMembers" stroke="#10b981" strokeWidth={2} name="New Members" />
                <Line type="monotone" dataKey="totalMembers" stroke="#3b82f6" strokeWidth={2} name="Total Members" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
