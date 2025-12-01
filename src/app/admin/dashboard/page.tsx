'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  User,
  TrendingUp,
  UserPlus,
  DollarSign,
  Activity,
  Search,
  Download,
  Bell,
  CheckCircle2,
  QrCode,
  Phone,
  Mail,
  Edit,
  Trash2,
  Ban,
  Eye,
  ShieldAlert,
  UserCog,
  Package,
  AlertTriangle,
  Ticket,
  UserX,
  Dumbbell,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Plus,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';
import type { Member, CheckIn } from '@/types';

// Mock data - In production, fetch from API
const mockStats = {
  totalMembers: 1247,
  activeMembers: 1189,
  expiringSoon: 34,
  expiredMembers: 24,
  activeToday: 89,
  newThisMonth: 23,
  revenue: 45680,
  pendingPayments: 12,
  revenueGrowth: '+15%',
  attendanceRate: '68%',
};

const mockStaff = [
  { id: 1, name: 'Sarah Mensah', email: 'sarah@gemfitness.com', role: 'receptionist', status: 'active', joinDate: '2025-01-15' },
  { id: 2, name: 'John Doe', email: 'john@gemfitness.com', role: 'receptionist', status: 'active', joinDate: '2025-03-20' },
];

const mockMembershipPlans = [
  { id: 1, name: 'Monthly', price: 200, duration: '1 month', status: 'active', features: ['Full gym access', 'Group classes', 'Locker facility'] },
  { id: 2, name: 'Quarterly', price: 500, duration: '3 months', status: 'active', features: ['Everything in Monthly', 'Priority booking', '1 free PT session'] },
  { id: 3, name: 'Annual', price: 1800, duration: '12 months', status: 'active', features: ['Everything in Quarterly', '3 free PT sessions', 'Nutrition consultation'] },
];

const mockClasses = [
  { id: 1, name: 'Early Birds Class', type: 'Cardio', instructor: 'Coach John', duration: 60, schedule: 'Mon-Fri - 6:30 AM', maxCapacity: 20, enrolled: 15, status: 'active', color: 'from-red-500 to-pink-500' },
  { id: 2, name: 'Boot Camp', type: 'HIIT', instructor: 'Coach Sarah', duration: 90, schedule: 'Mon-Fri - 5:30 AM', maxCapacity: 25, enrolled: 22, status: 'active', color: 'from-orange-500 to-yellow-500' },
  { id: 3, name: 'DM Class', type: 'Stepboard', instructor: 'Coach Mike', duration: 120, schedule: 'Tue, Thu - 7:00 AM', maxCapacity: 20, enrolled: 18, status: 'active', color: 'from-purple-500 to-pink-500' },
  { id: 4, name: 'Weight Training', type: 'Strength', instructor: 'Coach David', duration: 90, schedule: 'Mon, Wed, Fri - 7:00 PM', maxCapacity: 15, enrolled: 12, status: 'active', color: 'from-orange-500 to-red-500' },
];

const mockEvents = [
  { id: 1, title: 'New Year Fitness Challenge', description: 'Start 2026 strong with our month-long fitness challenge', eventDate: '2026-01-01', location: 'GemFitness Tema', maxAttendees: 100, registered: 45, status: 'upcoming', isFree: true, image: null },
  { id: 2, title: 'Nutrition Workshop', description: 'Learn about proper nutrition for your fitness goals', eventDate: '2025-12-15', location: 'Main Hall', maxAttendees: 50, registered: 32, status: 'upcoming', isFree: false, price: 50, image: null },
  { id: 3, title: 'Member Appreciation Day', description: 'Special event for all our valued members', eventDate: '2025-12-31', location: 'GemFitness Tema', maxAttendees: null, registered: 78, status: 'upcoming', isFree: true, image: null },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; role: string; firstName?: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'members' | 'classes' | 'events' | 'attendance' | 'payments' | 'plans' | 'staff' | 'analytics'>('overview');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'card'>('momo');
  
  // Real data states
  const [members, setMembers] = useState<Member[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiringSoon: 0,
    todayCheckIns: 0,
    monthlyRevenue: 0,
    recentPayments: [] as Array<{id: string; member: string; amount: number; date: string}>
  });
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Modal states
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDayPassModal, setShowDayPassModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Registration form state
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    registrationType: 'SELF' as 'SELF' | 'WALK_IN' | 'ADMIN',
    plan: 'ONE_MONTH'
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    qrCode: '',
    memberId: '',
    method: 'qr' as 'qr' | 'manual'
  });
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  // Suppress unused variable warnings for future features
  if (false) {
    console.log(showNewMemberModal, showMemberModal, showDayPassModal, selectedMember);
  }

  // Fetch real data functions
  const fetchMembers = async (limit?: number) => {
    try {
      const url = limit ? `/api/members?limit=${limit}` : '/api/members?limit=20';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    }
  };

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/checkins');
      if (!response.ok) {
        throw new Error(`Failed to fetch check-ins: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setCheckIns(data.checkIns || []);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      setCheckIns([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      const data = await response.json();
      setAnalytics({
        totalMembers: data.totalMembers || 0,
        activeMembers: data.activeMembers || 0,
        expiringSoon: data.expiringSoon || 0,
        todayCheckIns: data.todayCheckIns || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        recentPayments: data.recentPayments || []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default values on error to prevent infinite loading
      setAnalytics({
        totalMembers: 0,
        activeMembers: 0,
        expiringSoon: 0,
        todayCheckIns: 0,
        monthlyRevenue: 0,
        recentPayments: []
      });
    }
  };

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        console.log('📊 Auth response:', data);
        
        if (data.user && ['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(data.user.role)) {
          console.log('✅ User authenticated:', data.user.role);
          setUser(data.user);
          setIsAuthenticated(true);
          // Load initial data (only essentials)
          console.log('📥 Loading initial data...');
          await Promise.all([
            fetchCheckIns(),
            fetchAnalytics()
          ]);
          console.log('✅ Initial data loaded');
        } else {
          console.log('❌ No valid user, redirecting to login');
          router.push('/admin/login');
        }
      } catch (err) {
        console.error('❌ Auth error:', err);
        router.push('/admin/login');
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    // Set timeout for loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout
    
    checkAuth();

    return () => clearTimeout(timeoutId);
  }, [router]);

  // Fetch members when tab changes
  useEffect(() => {
    if (isAuthenticated && (activeTab === 'overview' || activeTab === 'members') && members.length === 0) {
      fetchMembers(activeTab === 'overview' ? 10 : undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Handle member registration
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Member registered successfully! QR Code: ${data.user.qrCode}`);
        setShowNewMemberModal(false);
        setNewMember({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          dateOfBirth: '',
          registrationType: 'SELF',
          plan: 'ONE_MONTH'
        });
        // Refresh members list
        fetchMembers();
        fetchAnalytics();
      } else {
        alert(data.error || 'Failed to register member');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register member');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingIn(true);

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode: checkInData.qrCode,
          method: checkInData.method,
          checkedBy: user?.email || 'admin'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Check-in successful for ${data.checkIn.member}!`);
        setShowCheckInModal(false);
        setCheckInData({ qrCode: '', memberId: '', method: 'qr' });
        // Refresh check-ins list
        fetchCheckIns();
        fetchAnalytics();
      } else {
        alert(data.error || 'Failed to check-in');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check-in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Permission checks
  const isManager = user?.role === 'MANAGER';
  const canViewReports = isManager;
  const canManagePayments = isManager;
  const canViewFinancials = isManager;
  const canManagePlans = isManager;
  const canManageStaff = isManager;
  const canSuspendMembers = isManager;
  const canManageClasses = isManager; // Only managers can add/edit/delete classes
  
  // Receptionist permissions (both roles can do these)
  const canRegisterMember = true;
  const canSellDayPass = true;
  const canUpdateBasicInfo = true;
  const canCreateEvents = true; // Both managers and receptionists can create events

  // Filtered members based on search
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone.includes(searchQuery) ||
    member.qrCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {loading ? (
        <div className="flex items-center justify-center w-full h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
            {loadingTimeout && (
              <p className="mt-2 text-sm text-yellow-600">
                This is taking longer than expected. Please check your connection.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <AdminSidebar
            adminUser={user?.email || user?.firstName || 'Admin'}
            adminRole={user?.role?.toLowerCase() === 'receptionist' ? 'receptionist' : 'manager'}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
          />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-[57px] lg:pt-0">
        {/* Top Bar - Desktop Only */}
        <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeTab === 'overview' && 'Dashboard overview and quick stats'}
                  {activeTab === 'checkin' && 'Member check-in management'}
                  {activeTab === 'members' && 'Member database and management'}
                  {activeTab === 'classes' && 'Gym class scheduling and management'}
                  {activeTab === 'events' && 'Special events and programs'}
                  {activeTab === 'attendance' && 'Member attendance history'}
                  {activeTab === 'payments' && 'Payment tracking and revenue'}
                  {activeTab === 'plans' && 'Membership plan management'}
                  {activeTab === 'staff' && 'Staff account management'}
                  {activeTab === 'analytics' && 'Business analytics and reports'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Total Members', value: analytics?.totalMembers?.toLocaleString() || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', visible: true },
                { label: 'Active Members', value: analytics?.activeMembers?.toLocaleString() || '0', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', visible: true },
                { label: 'Expiring Soon', value: analytics?.expiringSoon || '0', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', visible: true },
                { label: 'Checked In Today', value: analytics?.todayCheckIns || '0', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', visible: true },
                { label: 'Revenue (GH₵)', value: canViewFinancials ? analytics?.monthlyRevenue?.toLocaleString() || '0' : '***', icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50', visible: canViewFinancials },
                { label: 'Attendance Rate', value: '85%', icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50', visible: canViewFinancials },
              ].filter(stat => stat.visible).map((stat, i) => (
                <Card key={i} className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>

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
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {canRegisterMember && (
                    <Button onClick={() => setShowNewMemberModal(true)} className="h-auto flex-col gap-2 py-4 bg-orange-500 hover:bg-orange-600">
                      <UserPlus className="h-6 w-6" />
                      <span className="text-xs sm:text-sm">New Member</span>
                    </Button>
                  )}
                  <Button onClick={() => setActiveTab('checkin')} variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                    <QrCode className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">Check-In</span>
                  </Button>
                  {canSellDayPass && (
                    <Button onClick={() => setShowDayPassModal(true)} variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                      <Ticket className="h-6 w-6" />
                      <span className="text-xs sm:text-sm">Day Pass</span>
                    </Button>
                  )}
                  <Button onClick={() => setActiveTab('members')} variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                    <Search className="h-6 w-6" />
                    <span className="text-xs sm:text-sm">Find Member</span>
                  </Button>
                  {canViewReports && (
                    <Button variant="outline" className="h-auto flex-col gap-2 py-4 border-2">
                      <Download className="h-6 w-6" />
                      <span className="text-xs sm:text-sm">Reports</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity & Alerts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Expiring Soon Alert */}
              {analytics?.expiringSoon > 0 && (
                <Card className="border-2 border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-lg sm:text-xl text-yellow-900">Expiring Soon</CardTitle>
                    </div>
                    <CardDescription className="text-yellow-700">{analytics?.expiringSoon} memberships expiring in 3 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.filter(m => m.status === 'expiring_soon').slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{member.name}</p>
                            <p className="text-xs text-gray-500">Expires: {member.expiresAt}</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                            Contact
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4 border-2">
                      View All Expiring
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Today's Check-Ins */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Today&apos;s Check-Ins</CardTitle>
                  <CardDescription>{analytics?.todayCheckIns || 0} check-ins today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checkIns.map((checkin) => (
                      <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            checkin.method === 'qr' ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            {checkin.method === 'qr' ? <QrCode className="h-4 w-4 text-green-600" /> : <UserCheck className="h-4 w-4 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">{checkin.member}</p>
                            <p className="text-xs text-gray-500">{checkin.time} • {checkin.method === 'qr' ? 'QR Scan' : 'Manual'}</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setActiveTab('attendance')} variant="outline" className="w-full mt-4 border-2">
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
                    <CardDescription>View, search, and manage all members</CardDescription>
                  </div>
                  {canRegisterMember && (
                    <Button onClick={() => setShowNewMemberModal(true)} className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register New Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, phone, email, or QR code..."
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <select className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Expiring Soon</option>
                    <option>Expired</option>
                  </select>
                  <select className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500">
                    <option>All Plans</option>
                    <option>1 Month</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>12 Months</option>
                    <option>Daily Walk-In</option>
                  </select>
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Expires</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(searchQuery ? filteredMembers : members).map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.qrCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="text-sm text-gray-600">
                              <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</p>
                              <p className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{member.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.plan}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{member.expiresAt}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              member.status === 'active' ? 'bg-green-100 text-green-700' :
                              member.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {member.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowMemberModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUpdateBasicInfo && (
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canSuspendMembers && (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
                  <p className="text-sm text-gray-600">Showing {members.length} of {analytics?.totalMembers || 0} members</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Classes Management Tab */}
        {activeTab === 'classes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Class Management</CardTitle>
                    <CardDescription>Manage gym classes and schedules</CardDescription>
                  </div>
                  {canManageClasses && (
                    <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                      <Plus className="mr-2 h-5 w-5" />
                      Add New Class
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockClasses.map((classItem) => (
                    <Card key={classItem.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${classItem.color} flex items-center justify-center`}>
                            <Dumbbell className="h-6 w-6 text-white" />
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            classItem.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {classItem.status}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{classItem.type}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserCheck className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{classItem.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span>{classItem.duration} minutes</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span className="text-xs">{classItem.schedule}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500">Enrolled</p>
                            <p className="text-lg font-bold text-gray-900">{classItem.enrolled}/{classItem.maxCapacity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Capacity</p>
                            <p className="text-sm font-semibold text-orange-600">
                              {Math.round((classItem.enrolled / classItem.maxCapacity) * 100)}%
                            </p>
                          </div>
                        </div>

                        {canManageClasses && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Events Management Tab */}
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Events Management</CardTitle>
                    <CardDescription>Create and manage gym events (both staff roles can add events)</CardDescription>
                  </div>
                  {canCreateEvents && (
                    <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                      <Plus className="mr-2 h-5 w-5" />
                      Create New Event
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEvents.map((event) => (
                    <Card key={event.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Event Image Placeholder */}
                          <div className="w-full md:w-48 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            {event.image ? (
                              <Image src={event.image} alt={event.title} width={192} height={128} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-orange-400" />
                            )}
                          </div>

                          {/* Event Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                                <p className="text-sm text-gray-600">{event.description}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                                event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {event.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <p className="text-sm font-medium text-gray-900">{event.eventDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Location</p>
                                  <p className="text-sm font-medium text-gray-900">{event.location}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Registered</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.registered}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Ticket className="h-4 w-4 text-orange-500" />
                                <div>
                                  <p className="text-xs text-gray-500">Price</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.isFree ? 'Free' : `GH₵ ${event.price}`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {canCreateEvents && (
                                <>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
            {/* Check-In Interface */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Member Check-In</CardTitle>
                <CardDescription>Scan QR code or search by name, phone, or member ID</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Search & Scan Section */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Manual Search */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Manual Search</h3>
                        <Button
                          onClick={() => setShowCheckInModal(true)}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Quick Check-In
                        </Button>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Name, phone, or ID..."
                          className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      
                      {/* Search Results */}
                      {searchQuery && filteredMembers.length > 0 && (
                        <div className="border-2 border-gray-200 rounded-xl p-2 max-h-64 overflow-y-auto">
                          {filteredMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                              onClick={() => {
                                setSelectedMember(member);
                                setShowMemberModal(true);
                              }}
                            >
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.phone} • {member.qrCode}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                member.status === 'active' ? 'bg-green-100 text-green-700' :
                                member.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {member.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {searchQuery && filteredMembers.length === 0 && (
                        <div className="border-2 border-red-200 bg-red-50 rounded-xl p-6 text-center">
                          <UserX className="h-12 w-12 text-red-400 mx-auto mb-2" />
                          <p className="font-semibold text-red-900">Member Not Found</p>
                          <p className="text-sm text-red-600 mb-3">No member matches &quot;{searchQuery}&quot;</p>
                          {canRegisterMember && (
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                              Register New Member
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* QR Scanner */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">QR Code Scanner</h3>
                      <div className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                        <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                        <p className="font-semibold text-gray-700 mb-2">Scan Member QR Code</p>
                        <p className="text-sm text-gray-500 mb-4">Position code within frame</p>
                        <Button variant="outline" className="border-2">
                          <Activity className="mr-2 h-4 w-4" />
                          Activate Scanner
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Check-In Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t-2">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-700">{checkIns.length}</div>
                      <div className="text-xs text-gray-600 font-medium">Today</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-700">42</div>
                      <div className="text-xs text-gray-600 font-medium">Active Now</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-700">524</div>
                      <div className="text-xs text-gray-600 font-medium">This Week</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Check-Ins Today */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg">Recent Check-Ins</CardTitle>
                <CardDescription>Latest activity today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Checked By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {checkIns.map((checkin) => (
                        <tr key={checkin.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{checkin.time}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{checkin.member}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{checkin.memberId}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              checkin.method === 'qr' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {checkin.method.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{checkin.checkedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            {canManagePayments ? (
              <>
                <Card className="border-2 border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">Payment Management</CardTitle>
                    <CardDescription>Track all transactions, renewals, and revenue • MTN MoMo: 059 893 4010 (Gemfitness Centre)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Payment Method Selection */}
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Phone className="h-8 w-8 text-green-600" />
                          <div>
                            <h4 className="font-bold text-gray-900">MTN Mobile Money</h4>
                            <p className="text-sm text-gray-700">059 893 4010 - Gemfitness Centre</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'momo' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('momo')}
                            className={paymentMethod === 'momo' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            MTN MoMo
                          </Button>
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            Cash
                          </Button>
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'card' ? 'default' : 'outline'}
                            onClick={() => setPaymentMethod('card')}
                          >
                            Card/Bank
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-700">GH₵ {mockStats.revenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">{mockStats.revenueGrowth} from last month</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                        <p className="text-2xl font-bold text-yellow-700">{mockStats.pendingPayments}</p>
                        <p className="text-xs text-yellow-600 mt-1">Requires follow-up</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">This Month</p>
                        <p className="text-2xl font-bold text-blue-700">GH₵ 12,450</p>
                        <p className="text-xs text-blue-600 mt-1">23 transactions</p>
                      </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {members.slice(0, 5).map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">{member.joinDate}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{member.plan}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                GH₵ {member.plan === '1 Month' ? '200' : member.plan === '3 Months' ? '450' : member.plan === '6 Months' ? '1000' : member.plan === '12 Months' ? '2000' : '50'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  Success
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">PAY-{member.id.toString().padStart(6, '0')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-2 border-red-100 bg-red-50">
                <CardContent className="p-8 text-center">
                  <ShieldAlert className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-900 mb-2">Access Restricted</h3>
                  <p className="text-red-700">Only managers can access payment management</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Attendance History</CardTitle>
                    <CardDescription>Daily member check-in records</CardDescription>
                  </div>
                  <Button variant="outline" className="border-2">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input type="date" className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" />
                  <input type="date" className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" />
                  <Button variant="outline" className="border-2">Apply Filter</Button>
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Checked By</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {checkIns.map((checkin) => (
                        <tr key={checkin.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{checkin.time}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{checkin.member}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{checkin.memberId}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              checkin.method === 'qr' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {checkin.method.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{checkin.checkedBy}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Valid
                            </span>
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

        {/* Membership Plans Tab */}
        {activeTab === 'plans' && canManagePlans && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Registration Fees Section */}
            <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                  Registration Fees (One-Time)
                </CardTitle>
                <CardDescription>New members must pay registration fee before selecting a membership plan</CardDescription>
                <div className="mt-3 p-3 bg-green-100 border-2 border-green-300 rounded-lg flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-700" />
                  <div>
                    <p className="font-semibold text-green-900">MTN Mobile Money: 059 893 4010</p>
                    <p className="text-sm text-green-700">Gemfitness Centre • Also accepts Cash & Card</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-orange-600" />
                      <h3 className="font-bold text-gray-900">Single</h3>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">GH₵ 250</p>
                    <p className="text-sm text-gray-600 mt-1">Individual membership</p>
                  </div>
                  <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <h3 className="font-bold text-gray-900">Couple</h3>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">GH₵ 400</p>
                    <p className="text-sm text-gray-600 mt-1">2 members package</p>
                  </div>
                  <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-orange-600" />
                      <h3 className="font-bold text-gray-900">Family</h3>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">GH₵ 1,000</p>
                    <p className="text-sm text-gray-600 mt-1">Up to 5 members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Membership Plans</CardTitle>
                    <CardDescription>Monthly subscription plans (starts payment next month after registration)</CardDescription>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                    <Package className="mr-2 h-5 w-5" />
                    Add New Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {mockMembershipPlans.map((plan) => (
                    <Card key={plan.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-orange-600">GH₵ {plan.price}</span>
                          <span className="text-gray-600 ml-2">/ {plan.duration}</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && canManageStaff && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Staff Management</CardTitle>
                    <CardDescription>Manage receptionist accounts</CardDescription>
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
                    <UserCog className="mr-2 h-5 w-5" />
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Join Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{staff.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{staff.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{staff.joinDate}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && canViewReports && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Business Analytics</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-blue-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
                    <p className="text-3xl font-bold text-blue-900">+15.3%</p>
                    <p className="text-xs text-blue-700 mt-2">vs last month</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <Users className="h-8 w-8 text-green-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Member Retention</p>
                    <p className="text-3xl font-bold text-green-900">92.4%</p>
                    <p className="text-xs text-green-700 mt-2">Above target</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Activity className="h-8 w-8 text-purple-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Avg. Check-ins/Day</p>
                    <p className="text-3xl font-bold text-purple-900">87</p>
                    <p className="text-xs text-purple-700 mt-2">Peak: 124</p>
                  </div>
                </div>

                <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Detailed Analytics</p>
                  <p className="text-sm text-gray-500">Charts and graphs will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>
      </div>

      {/* Member Registration Modal */}
      {showNewMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Register New Member</h2>
            <form onSubmit={handleRegisterMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newMember.firstName}
                    onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newMember.lastName}
                    onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={newMember.dateOfBirth}
                  onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registration Type</label>
                <select
                  value={newMember.registrationType}
                  onChange={(e) => setNewMember({ ...newMember, registrationType: e.target.value as 'SELF' | 'WALK_IN' | 'ADMIN' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="SELF">Self Registration - GH₵ 250</option>
                  <option value="WALK_IN">Walk-In - GH₵ 250</option>
                  <option value="ADMIN">Admin Registration - Free</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Membership Plan</label>
                <select
                  value={newMember.plan}
                  onChange={(e) => setNewMember({ ...newMember, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ONE_MONTH">1 Month - GH₵ 200</option>
                  <option value="THREE_MONTHS">3 Months - GH₵ 450</option>
                  <option value="SIX_MONTHS">6 Months - GH₵ 1000</option>
                  <option value="TWELVE_MONTHS">12 Months - GH₵ 2000</option>
                  <option value="DAILY">Daily Walk-In - GH₵ 50</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewMemberModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isRegistering ? 'Registering...' : 'Register Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Member Check-In</h2>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Member QR Code</label>
                <input
                  type="text"
                  required
                  placeholder="Enter or scan QR code"
                  value={checkInData.qrCode}
                  onChange={(e) => setCheckInData({ ...checkInData, qrCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-In Method</label>
                <select
                  value={checkInData.method}
                  onChange={(e) => setCheckInData({ ...checkInData, method: e.target.value as 'qr' | 'manual' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="qr">QR Code Scan</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCheckingIn}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {isCheckingIn ? 'Checking In...' : 'Check In Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
