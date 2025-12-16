'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  QrCode,
  Activity,
  LogOut,
  CreditCard,
  Flame,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Award,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Star,
  Zap,
  TrendingDown,
} from 'lucide-react';

type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address: string | null;
  emergencyContact: string;
  emergencyPhone: string;
  fitnessGoals: string | null;
  qrCode: string | null;
  subscriptions?: Array<{
    id: string;
    plan: string;
    status: string;
    startDate: Date;
    endDate: Date;
    amount: number;
  }>;
  checkIns?: Array<{
    id: string;
    checkInTime: Date;
    checkOutTime: Date | null;
  }>;
};

type Event = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  endDate: string | null;
  location: string;
  image: string | null;
  maxAttendees: number | null;
  registered: number;
  isFree: boolean;
  price: number | null;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
};

export default function MemberDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  // Use user directly from context instead of duplicating in state
  const userData = user as unknown as UserData | null;

  useEffect(() => {
    if (!isAuthenticated) {
      if (!authLoading) {
        router.push('/login');
      }
      return;
    }

    // Fetch events
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          // Filter to show upcoming and ongoing events (including cancelled for transparency)
          const relevantEvents = data.events.filter(
            (e: Event) => e.status !== 'COMPLETED'
          );
          setEvents(relevantEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [isAuthenticated, authLoading, router]);

  // Calculate values using useMemo before conditional returns
  const activeSubscription = userData?.subscriptions?.find((sub) => sub.status === 'ACTIVE');
  const recentCheckIns = userData?.checkIns?.slice(0, 10) || [];
  
  // Calculate days until subscription expires
  const daysUntilExpiry = useMemo(() => {
    if (!activeSubscription) return 0;
    const now = new Date();
    return Math.ceil((new Date(activeSubscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [activeSubscription]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }
  
  // Calculate streak (mock data for now - would be calculated from actual check-ins)
  const currentStreak = recentCheckIns.length > 0 ? 7 : 0;
  const longestStreak = 15;
  const totalCheckIns = recentCheckIns.length;

  // Generate attendance heatmap data (last 30 days)
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayCheckIns = recentCheckIns.filter(
        (ci) => new Date(ci.checkInTime).toDateString() === date.toDateString()
      );
      data.push({
        date: date.toISOString().split('T')[0],
        count: dayCheckIns.length,
        day: date.getDay(),
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Weekly activity stats
  const weeklyStats = {
    thisWeek: recentCheckIns.filter((ci) => {
      const now = new Date();
      const diff = now.getTime() - new Date(ci.checkInTime).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length,
    lastWeek: 5, // Mock data
    avgWorkoutTime: '1h 15m', // Mock data
  };

  // Achievements
  const achievements = [
    { id: 1, title: 'First Week', description: 'Completed your first week!', icon: '🎉', unlocked: currentStreak >= 7 },
    { id: 2, title: 'Consistency King', description: '7 day streak!', icon: '👑', unlocked: currentStreak >= 7 },
    { id: 3, title: 'Early Bird', description: 'Check-in before 7 AM', icon: '🌅', unlocked: false },
    { id: 4, title: 'Century Club', description: '100 total check-ins', icon: '💯', unlocked: false },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                <span className="text-orange-500">GemFitness</span>
                <span className="hidden sm:inline"> Member Portal</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-xs md:text-sm text-gray-600 hidden sm:block">
                Welcome, <strong className="truncate max-w-[100px] md:max-w-none inline-block align-bottom">{userData.firstName}!</strong>
              </span>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 whitespace-nowrap px-2 md:px-4"
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats Grid - Premium Modern Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          {/* Current Streak - Fire Theme with Glassmorphism */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-1 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                  </div>
                  <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <TrendingUp className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                    {currentStreak}
                  </p>
                  <span className="text-orange-500 text-sm md:text-lg font-bold">days</span>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-800">Current Streak</p>
                <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                  Keep the fire burning!
                </p>
              </div>
            </div>
          </div>

          {/* Total Visits - Ocean Wave Theme */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-1 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Calendar className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    {totalCheckIns}
                  </p>
                  <span className="text-blue-500 text-sm md:text-lg font-bold">visits</span>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-800">Total Visits</p>
                <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  This month&apos;s progress
                </p>
              </div>
            </div>
          </div>

          {/* Best Streak - Royal Crown Theme */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-1 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Trophy className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                  <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Award className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    {longestStreak}
                  </p>
                  <span className="text-purple-500 text-sm md:text-lg font-bold">days</span>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-800">Best Streak</p>
                <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                  Your personal record
                </p>
              </div>
            </div>
          </div>

          {/* Days Left - Fresh Green Theme */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 p-1 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 h-full">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Clock className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                  </div>
                  <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <CalendarDays className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 bg-clip-text text-transparent">
                    {daysUntilExpiry}
                  </p>
                  <span className="text-emerald-500 text-sm md:text-lg font-bold">days</span>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-800">Days Left</p>
                <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Until renewal time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Activity & Achievements Row */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{weeklyStats.thisWeek}</p>
                    <p className="text-xs md:text-sm text-gray-600">Workouts this week</p>
                  </div>
                  <div className={`flex items-center gap-1 ${weeklyStats.thisWeek >= weeklyStats.lastWeek ? 'text-green-600' : 'text-red-600'}`}>
                    {weeklyStats.thisWeek >= weeklyStats.lastWeek ? (
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                    <span className="text-sm md:text-base font-semibold">
                      {Math.abs(weeklyStats.thisWeek - weeklyStats.lastWeek)}
                    </span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
                    <span>Last week</span>
                    <span className="font-semibold">{weeklyStats.lastWeek} workouts</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm text-gray-600">
                    <span>Avg. duration</span>
                    <span className="font-semibold">{weeklyStats.avgWorkoutTime}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs md:text-sm text-gray-700">
                    <Zap className="w-4 h-4 inline mr-1 text-orange-500" />
                    <strong>Goal:</strong> 4 workouts per week
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((weeklyStats.thisWeek / 4) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="text-2xl md:text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold text-xs md:text-sm text-gray-900 mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-[10px] md:text-xs text-gray-600">{achievement.description}</p>
                    {achievement.unlocked && (
                      <div className="mt-2">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-600 inline" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-orange-500 text-orange-500 hover:bg-orange-50 text-xs md:text-sm">
                View All Badges
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Heatmap */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Attendance Calendar (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col gap-1 min-w-full">
                {/* Week labels */}
                <div className="flex gap-1 mb-2 pl-8">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="w-8 md:w-10 text-[10px] md:text-xs text-gray-600 text-center font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Heatmap grid */}
                <div className="flex flex-wrap gap-1">
                  {heatmapData.map((data, idx) => (
                    <div
                      key={idx}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded transition-all hover:scale-110 cursor-pointer ${
                        data.count === 0
                          ? 'bg-gray-100 border border-gray-200'
                          : data.count === 1
                          ? 'bg-orange-200 border border-orange-300'
                          : data.count === 2
                          ? 'bg-orange-400 border border-orange-500'
                          : 'bg-orange-600 border border-orange-700'
                      }`}
                      title={`${data.date}: ${data.count} check-in${data.count !== 1 ? 's' : ''}`}
                    >
                      {data.count > 0 && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] md:text-xs font-bold text-white">
                            {data.count}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <div className="w-4 h-4 bg-orange-200 border border-orange-300 rounded"></div>
                    <div className="w-4 h-4 bg-orange-400 border border-orange-500 rounded"></div>
                    <div className="w-4 h-4 bg-orange-600 border border-orange-700 rounded"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl flex items-center gap-2">
                <User className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-sm md:text-base truncate">{userData.firstName} {userData.lastName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-sm md:text-base truncate">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 md:w-5 md:h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-sm md:text-base">{userData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-orange-500 mt-1 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm text-gray-600">Date of Birth</p>
                    <p className="font-semibold text-sm md:text-base">
                      {new Date(userData.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {userData.address && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-orange-500 mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-gray-600">Address</p>
                      <p className="font-semibold text-sm md:text-base">{userData.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {userData.emergencyContact && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-500" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-sm md:text-base">{userData.emergencyContact}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-sm md:text-base">{userData.emergencyPhone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fitness Goals */}
              {userData.fitnessGoals && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Fitness Goals
                  </h3>
                  <p className="text-sm md:text-base text-gray-700">{userData.fitnessGoals}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Your QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userData.qrCode ? (
                <>
                  <QRCodeDisplay 
                    data={userData.qrCode}
                    size={256}
                    showDownload={true}
                    label={userData.qrCode}
                    className="py-4"
                  />
                  <p className="text-xs md:text-sm text-gray-600 text-center">
                    Show this QR code at reception to check in
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  QR code not available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Membership Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSubscription ? (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="inline-block px-2 md:px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full mb-2">
                          ACTIVE
                        </span>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">
                          {activeSubscription.plan.replace('_', ' ')} Plan
                        </h3>
                      </div>
                      <Award className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Started</p>
                        <p className="font-semibold text-sm md:text-base text-gray-900">
                          {new Date(activeSubscription.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Expires</p>
                        <p className="font-semibold text-sm md:text-base text-gray-900">
                          {new Date(activeSubscription.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Amount Paid</p>
                        <p className="font-semibold text-sm md:text-base text-gray-900">
                          GH₵ {activeSubscription.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-gray-600">Days Remaining</p>
                        <p className="font-semibold text-sm md:text-base text-gray-900">
                          {daysUntilExpiry} days
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-sm md:text-base">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                    <Button variant="outline" className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-50 text-sm md:text-base">
                      <Calendar className="w-4 h-4 mr-2" />
                      Renew Early
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-center">
                  <p className="text-base md:text-lg font-semibold text-red-700 mb-2">No Active Membership</p>
                  <p className="text-xs md:text-sm text-red-600 mb-4">Subscribe now to access all gym facilities</p>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => {
                    const eventDate = new Date(event.eventDate);
                    const statusStyles = {
                      UPCOMING: 'bg-blue-100 text-blue-700 border-blue-200',
                      ONGOING: 'bg-green-100 text-green-700 border-green-200',
                      CANCELLED: 'bg-red-100 text-red-700 border-red-200',
                      COMPLETED: 'bg-gray-100 text-gray-700 border-gray-200'
                    };
                    const isCancelled = event.status === 'CANCELLED';
                    
                    return (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg hover:shadow-md transition-shadow border ${
                          isCancelled 
                            ? 'bg-red-50 border-red-200 opacity-75'
                            : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-semibold text-sm md:text-base truncate ${
                                isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}>
                                {event.title}
                              </h4>
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                                statusStyles[event.status]
                              }`}>
                                {event.status}
                              </span>
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-600 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {event.location}
                            </p>
                            {!event.isFree && (
                              <p className="text-[10px] md:text-xs text-orange-600 font-semibold mt-1">
                                GH₵ {event.price?.toFixed(2)}
                              </p>
                            )}
                            {isCancelled && (
                              <p className="text-[10px] md:text-xs text-red-600 font-semibold mt-1">
                                ⚠️ This event has been cancelled
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] md:text-xs font-semibold text-orange-600">
                              {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-500">
                              {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
              )}
              {events.length > 5 && (
                <Button variant="outline" className="w-full mt-4 border-orange-500 text-orange-500 hover:bg-orange-50 text-xs md:text-sm">
                  View All Events ({events.length})
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Check-ins */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {recentCheckIns.map((checkIn: { id: string; checkInTime: Date; checkOutTime: Date | null }) => (
                    <div
                      key={checkIn.id}
                      className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                        <p className="font-semibold text-xs md:text-sm text-gray-900 truncate">
                          {new Date(checkIn.checkInTime).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="ml-4 md:ml-5 space-y-1">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="text-gray-600">Check-in:</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        {checkIn.checkOutTime && (
                          <div className="flex items-center gap-2 text-xs md:text-sm">
                            <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                            <span className="text-gray-600">Check-out:</span>
                            <span className="font-semibold text-gray-900">
                              {new Date(checkIn.checkOutTime).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <Activity className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                  <p className="text-gray-600 text-base md:text-lg font-semibold mb-2">No check-ins yet</p>
                  <p className="text-gray-500 text-xs md:text-sm">Visit the gym and scan your QR code to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
