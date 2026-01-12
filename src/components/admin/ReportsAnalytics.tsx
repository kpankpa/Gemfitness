'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, Users, TrendingUp, Calendar, Download, 
  Filter, Activity, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Transaction {
  date: Date | string;
  member: string;
  email: string;
  type: string;
  plan: string;
  amount: number;
  status: string;
}

interface CheckInRecord {
  date: Date | string;
  member: string;
  email: string;
  method: string;
}

interface NewMember {
  date: Date | string;
  name: string;
  email: string;
  hasActiveSubscription: boolean;
}

interface ClassInfo {
  className: string;
  instructor: string;
  maxCapacity: number;
  totalEnrollments: number;
  attendees: Array<{ member: string; enrolledAt: Date }>;
}

interface ReportData {
  summary?: {
    totalRevenue?: number;
    subscriptionRevenue?: number;
    registrationRevenue?: number;
    totalTransactions?: number;
    averageTransactionValue?: number;
    totalCheckIns?: number;
    uniqueMembers?: number;
    averagePerDay?: number;
    peakDay?: [string, number];
    newMembers?: number;
    totalMembers?: number;
    activeMembers?: number;
    inactiveMembers?: number;
    growthRate?: string;
    totalEnrollments?: number;
    totalClasses?: number;
    averageEnrollmentPerClass?: number;
  };
  breakdown?: {
    byPlan?: Array<{ plan: string; revenue: number; percentage: string }>;
    daily?: Array<{ date: string; revenue?: number; count?: number }>;
    byMember?: Array<{ memberName: string; email: string; count: number; lastCheckIn: Date }>;
    hourly?: Array<{ hour: string; count: number }>;
  };
  transactions?: Transaction[];
  recentCheckIns?: CheckInRecord[];
  newMembers?: NewMember[];
  classes?: ClassInfo[];
  // For overview report
  period?: { startDate: Date; endDate: Date };
  overview?: {
    revenue?: ReportData['summary'];
    attendance?: ReportData['summary'];
    memberGrowth?: ReportData['summary'];
    classPerformance?: ReportData['summary'];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsAnalytics() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        console.error('Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, dateRange]);

  const exportReport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData,
          format,
          reportType: selectedReport
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and data analysis</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportReport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Report Type */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="overview">Overview</option>
                <option value="revenue">Revenue</option>
                <option value="attendance">Attendance</option>
                <option value="member-growth">Member Growth</option>
                <option value="class-performance">Class Performance</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Quick Date Ranges */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Quick Select</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    setDateRange({
                      startDate: firstDay.toISOString().split('T')[0],
                      endDate: today.toISOString().split('T')[0]
                    });
                  }}
                >
                  This Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                    setDateRange({
                      startDate: lastMonth.toISOString().split('T')[0],
                      endDate: lastDay.toISOString().split('T')[0]
                    });
                  }}
                >
                  Last Month
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {selectedReport === 'revenue' && reportData.summary && reportData.breakdown && (
            <RevenueReport data={reportData} formatCurrency={formatCurrency} />
          )}
          {selectedReport === 'attendance' && reportData.summary && reportData.breakdown && (
            <AttendanceReport data={reportData} />
          )}
          {selectedReport === 'member-growth' && reportData.summary && reportData.breakdown && (
            <MemberGrowthReport data={reportData} />
          )}
          {selectedReport === 'class-performance' && reportData.summary && (
            <ClassPerformanceReport data={reportData} />
          )}
          {selectedReport === 'overview' && reportData.overview && reportData.period && (
            <OverviewReport data={reportData as OverviewData} formatCurrency={formatCurrency} />
          )}
        </>
      )}
    </div>
  );
}

// Revenue Report Component
function RevenueReport({ data, formatCurrency }: { data: ReportData; formatCurrency: (n: number) => string }) {
  if (!data.summary || !data.breakdown) return null;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.subscriptionRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">From memberships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Registration Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.registrationRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">From new members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.averageTransactionValue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
          <CardDescription>Revenue breakdown by day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.breakdown.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.breakdown?.byPlan || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.breakdown.byPlan?.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.transactions?.slice(0, 10).map((t, i) => (
                <div key={i} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium text-sm">{t.member}</p>
                    <p className="text-xs text-gray-500">{t.type} - {t.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(t.amount)}</p>
                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Attendance Report Component
function AttendanceReport({ data }: { data: ReportData }) {
  if (!data.summary || !data.breakdown) return null;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Check-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCheckIns}</div>
            <Activity className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unique Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueMembers}</div>
            <Users className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.averagePerDay}</div>
            <p className="text-xs text-gray-500 mt-1">Check-ins/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Peak Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.peakDay?.[1] || 0}</div>
            <p className="text-xs text-gray-500 mt-1">{data.summary.peakDay?.[0] || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.breakdown?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Check-ins by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.breakdown?.hourly || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Members */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.breakdown.byMember?.slice(0, 10).map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">{m.memberName}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{m.count}</p>
                  <p className="text-xs text-gray-500">check-ins</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Member Growth Report Component
function MemberGrowthReport({ data }: { data: ReportData }) {
  if (!data.summary || !data.breakdown) return null;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.newMembers}</div>
            <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalMembers}</div>
            <Users className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.growthRate}</div>
            <p className="text-xs text-gray-500 mt-1">Compared to previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeMembers}</div>
            <p className="text-xs text-gray-500 mt-1">With active subscriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Registration Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.breakdown?.daily || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Members */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Member Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {data.newMembers?.map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{new Date(m.date).toLocaleDateString()}</p>
                  <p className={`text-xs ${m.hasActiveSubscription ? 'text-green-600' : 'text-gray-500'}`}>
                    {m.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Class Performance Report Component
function ClassPerformanceReport({ data }: { data: ReportData }) {
  if (!data.summary) return null;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalEnrollments}</div>
            <Award className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalClasses}</div>
            <Calendar className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.averageEnrollmentPerClass}</div>
            <p className="text-xs text-gray-500 mt-1">Per class</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Class Name</th>
                  <th className="text-left p-2">Instructor</th>
                  <th className="text-center p-2">Enrollments</th>
                  <th className="text-center p-2">Max Capacity</th>
                  <th className="text-center p-2">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {data.classes?.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{c.className}</td>
                    <td className="p-2">{c.instructor}</td>
                    <td className="p-2 text-center">{c.totalEnrollments}</td>
                    <td className="p-2 text-center">{c.maxCapacity}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        (c.totalEnrollments / c.maxCapacity) * 100 > 80 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {((c.totalEnrollments / c.maxCapacity) * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Overview Report Component
// Overview Report Component
interface OverviewData {
  period: { startDate: Date; endDate: Date };
  overview: {
    revenue?: ReportData['summary'];
    attendance?: ReportData['summary'];
    memberGrowth?: ReportData['summary'];
    classPerformance?: ReportData['summary'];
  };
}

function OverviewReport({ data, formatCurrency }: { data: OverviewData; formatCurrency: (n: number) => string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.revenue?.totalRevenue || 0)}</div>
            <DollarSign className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Check-Ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.attendance?.totalCheckIns || 0}</div>
            <Activity className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.memberGrowth?.newMembers || 0}</div>
            <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Class Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.classPerformance?.totalEnrollments || 0}</div>
            <Award className="h-4 w-4 text-gray-400 mt-1" />
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-600 text-center">
        Select a specific report type from the filters above for detailed analysis
      </p>
    </div>
  );
}
