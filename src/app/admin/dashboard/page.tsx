'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  UserPlus,
  DollarSign,
  Activity,
  Clock,
  Search,
  Filter,
  Download,
  Settings,
  LogOut,
  Bell,
  BarChart3,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Mock data - In production, fetch from API
const mockStats = {
  totalMembers: 1247,
  activeToday: 89,
  newThisMonth: 23,
  revenue: 45680,
  pendingPayments: 12,
  classesToday: 8,
};

const mockRecentMembers = [
  { id: 1, name: 'Kwame Mensah', plan: 'Quarterly', status: 'active', joinDate: '2025-11-20', phone: '024 555 0001' },
  { id: 2, name: 'Ama Serwaa', plan: 'Monthly', status: 'active', joinDate: '2025-11-22', phone: '050 555 0002' },
  { id: 3, name: 'Kofi Asante', plan: 'Annual', status: 'pending', joinDate: '2025-11-25', phone: '024 555 0003' },
  { id: 4, name: 'Akua Frimpong', plan: 'Monthly', status: 'active', joinDate: '2025-11-26', phone: '050 555 0004' },
];

const mockRecentCheckIns = [
  { id: 1, member: 'Kwame Mensah', time: '07:30 AM', status: 'checked-in' },
  { id: 2, member: 'Ama Serwaa', time: '08:15 AM', status: 'checked-in' },
  { id: 3, member: 'Yaw Boateng', time: '09:00 AM', status: 'checked-in' },
  { id: 4, member: 'Efua Owusu', time: '09:45 AM', status: 'checked-in' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'checkin' | 'payments'>('overview');

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem('adminAuth');
    const user = localStorage.getItem('adminUser');
    
    if (!isAuth) {
      router.push('/admin/login');
    } else {
      setAdminUser(user || 'Admin');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="GemFitness Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">GemFitness Admin</h1>
                <p className="text-xs text-gray-500">Reception Portal</p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{adminUser}</p>
                  <p className="text-xs text-gray-500">Receptionist</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'checkin', label: 'Check-In', icon: UserCheck },
              { id: 'payments', label: 'Payments', icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Total Members', value: mockStats.totalMembers.toLocaleString(), icon: Users, color: 'blue', change: '+5%' },
                { label: 'Active Today', value: mockStats.activeToday, icon: Activity, color: 'green', change: '+12%' },
                { label: 'New This Month', value: mockStats.newThisMonth, icon: UserPlus, color: 'purple', change: '+8%' },
                { label: 'Revenue (GH₵)', value: mockStats.revenue.toLocaleString(), icon: DollarSign, color: 'orange', change: '+15%' },
              ].map((stat, i) => (
                <Card key={i} className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-8 w-8 text-${stat.color}-500`} />
                      <span className="text-xs font-semibold text-green-600">{stat.change}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button className="h-auto flex-col gap-2 py-4 bg-orange-500 hover:bg-orange-600">
                    <UserPlus className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">New Member</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                    <UserCheck className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">Check-In</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                    <CreditCard className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">Payment</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                    <Download className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Members */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Recent Members</CardTitle>
                  <CardDescription>Latest registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockRecentMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.plan} • {member.joinDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-2">
                    View All Members
                  </Button>
                </CardContent>
              </Card>

              {/* Today's Check-Ins */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Today&apos;s Check-Ins</CardTitle>
                  <CardDescription>Real-time attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockRecentCheckIns.map((checkin) => (
                      <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{checkin.member}</p>
                            <p className="text-xs text-gray-500">{checkin.time}</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-2">
                    View All Check-Ins
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Member Management</CardTitle>
                    <CardDescription>Search, filter, and manage members</CardDescription>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Add New Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <Button variant="outline" className="border-2">
                    <Filter className="mr-2 h-5 w-5" />
                    Filter
                  </Button>
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Join Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockRecentMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.plan}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{member.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{member.joinDate}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'checkin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Member Check-In</CardTitle>
                <CardDescription>Scan member ID or search manually</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Search Member */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search member by name or ID..."
                      className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Quick Check-In Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">89</div>
                      <div className="text-xs text-gray-600">Today</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">42</div>
                      <div className="text-xs text-gray-600">Active Now</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">524</div>
                      <div className="text-xs text-gray-600">This Week</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Payment Management</CardTitle>
                <CardDescription>Track payments and renewals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Payment management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
