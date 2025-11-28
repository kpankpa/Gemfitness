'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Clock,
  Award,
  Settings,
  LogOut,
  Activity,
  Flame,
  Target,
  Dumbbell,
  Heart,
  CheckCircle2,
  Bell,
  CreditCard,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Crown,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { DashboardData } from '@/types';

export default function MemberDashboard() {
  // Real data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Kay'); // Fallback

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      // For demo, use a test email. In production, this comes from auth
      const testEmail = 'kay@gemfitness.com';
      const response = await fetch(`/api/member/dashboard?email=${encodeURIComponent(testEmail)}`);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setUserName(data.user.name);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Classes available to book
  const upcomingClasses = [
    {
      name: 'Early Birds Class',
      time: 'Tomorrow, 6:30 AM',
      instructor: 'GemFitness Team',
      duration: '1 hour',
      spots: '3 spots left',
      type: 'Cardio',
      color: 'from-red-500 to-pink-500',
    },
    {
      name: 'Boot Camp',
      time: 'Tomorrow, 5:30 AM',
      instructor: 'GemFitness Team',
      duration: '1.5 hours',
      spots: '5 spots left',
      type: 'HIIT',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      name: 'DM Class',
      time: 'Dec 2, 7:00 AM',
      instructor: 'GemFitness Team',
      duration: '2 hours',
      spots: 'Available',
      type: 'Stepboard',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  // Classes the member has already booked
  const myBookedClasses = [
    {
      name: 'Boot Camp',
      bookedFor: 'Nov 28, 2025',
      time: '5:30 AM - 7:00 AM',
      instructor: 'Coach Sarah',
      duration: '90 min',
      type: 'HIIT',
      status: 'confirmed',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      name: 'Early Birds Class',
      bookedFor: 'Nov 29, 2025',
      time: '6:30 AM - 7:30 AM',
      instructor: 'Coach John',
      duration: '60 min',
      type: 'Cardio',
      status: 'confirmed',
      color: 'from-red-500 to-pink-500',
    },
    {
      name: 'Weight Training',
      bookedFor: 'Nov 30, 2025',
      time: '7:00 PM - 8:30 PM',
      instructor: 'Coach David',
      duration: '90 min',
      type: 'Strength',
      status: 'confirmed',
      color: 'from-orange-500 to-red-500',
    },
    {
      name: 'DM Class',
      bookedFor: 'Dec 2, 2025',
      time: '7:00 AM - 9:00 AM',
      instructor: 'Coach Mike',
      duration: '120 min',
      type: 'Stepboard',
      status: 'confirmed',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const stats = [
    {
      icon: Flame,
      label: 'Workout Streak',
      value: '12 days',
      change: '+3 from last week',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Activity,
      label: 'Classes Attended',
      value: '24',
      change: 'This month',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      label: 'Goals Achieved',
      value: '8/10',
      change: '80% complete',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Heart,
      label: 'Active Minutes',
      value: '1,240',
      change: 'This month',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const recentActivity = [
    { class: 'Boot Camp', date: 'Nov 26, 2025', duration: '90 min', calories: '450' },
    { class: 'Regular Session', date: 'Nov 25, 2025', duration: '90 min', calories: '380' },
    { class: 'Early Birds Class', date: 'Nov 24, 2025', duration: '60 min', calories: '320' },
    { class: 'DM Class', date: 'Nov 23, 2025', duration: '120 min', calories: '520' },
  ];

  const quickActions = [
    { icon: Calendar, label: 'Book a Class', href: '/classes', color: 'orange' },
    { icon: CreditCard, label: 'Billing', href: '/membership', color: 'blue' },
    { icon: Users, label: 'Refer a Friend', href: '/signup', color: 'purple' },
    { icon: Settings, label: 'Settings', href: '/dashboard', color: 'gray' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}! </h1>
                <p className="text-sm text-gray-600">Let&apos;s crush your fitness goals today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full"></span>
              </Button>
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Membership Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-6 w-6" />
                    <CardTitle className="text-2xl font-bold">{dashboardData?.membership?.plan || 'Basic'} Membership</CardTitle>
                  </div>
                  <CardDescription className="text-white/90 text-base">
                    Member since {dashboardData?.user?.memberSince || 'January 2026'}
                  </CardDescription>
                </div>
                <div className={`backdrop-blur-sm px-4 py-2 rounded-full ${
                  dashboardData?.membership?.status === 'active' ? 'bg-green-500/20' :
                  dashboardData?.membership?.status === 'expiring_soon' ? 'bg-yellow-500/20' :
                  'bg-red-500/20'
                }`}>
                  <span className="text-sm font-semibold">
                    {dashboardData?.membership?.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="text-sm text-white/80 mb-1">Next Billing</div>
                  <div className="text-lg font-bold">Jan 15, 2026</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="text-sm text-white/80 mb-1">Classes Left</div>
                  <div className="text-lg font-bold">Unlimited</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <div className="text-sm text-white/80 mb-1">Guest Passes</div>
                  <div className="text-lg font-bold">2 Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium mb-1">{stat.label}</div>
                  <div className="text-xs text-orange-600 font-semibold">{stat.change}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Booked Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-orange-500" />
                        My Booked Classes
                      </CardTitle>
                      <CardDescription>Your confirmed class schedule</CardDescription>
                    </div>
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      {dashboardData?.bookedClasses?.length || 0} Booked
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(dashboardData?.bookedClasses || []).map((classItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all group"
                    >
                      <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${classItem.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <CheckCircle2 className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                          {classItem.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-gray-900">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            {classItem.bookedFor}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {classItem.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {classItem.instructor}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                            {classItem.type}
                          </span>
                          <span className="text-xs text-gray-500">{classItem.duration}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold capitalize">
                            {classItem.status}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400">
                        Cancel
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Classes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">Available Classes</CardTitle>
                      <CardDescription>Book your next workout session</CardDescription>
                    </div>
                    <Link href="/classes">
                      <Button variant="outline" className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(dashboardData?.availableClasses || upcomingClasses).map((classItem, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:shadow-md transition-all group"
                    >
                      <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${classItem.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Dumbbell className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                          {classItem.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {classItem.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {classItem.instructor}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                            {classItem.type}
                          </span>
                          <span className="text-xs text-gray-500">{classItem.duration}</span>
                          <span className="text-xs text-green-600 font-semibold">{classItem.spots}</span>
                        </div>
                      </div>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg">
                        Book Now
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription>Your workout history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors border border-gray-100 hover:border-orange-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{activity.class}</div>
                            <div className="text-sm text-gray-600">{activity.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{activity.duration}</div>
                          <div className="text-xs text-orange-600">{activity.calories} cal</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between hover:bg-orange-50 hover:text-orange-600 group"
                      >
                        <span className="flex items-center gap-3">
                          <action.icon className="h-5 w-5" />
                          {action.label}
                        </span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-2 border-gray-100 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-xl font-bold text-gray-900">Monthly Goal</CardTitle>
                  </div>
                  <CardDescription>20 classes to unlock achievement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ width: '80%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600 font-medium">16 / 20 classes</span>
                        <span className="text-purple-600 font-bold">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">4 more classes to unlock badge!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Need Help?</CardTitle>
                  <CardDescription>We&apos;re here for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href="tel:0249003832"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all group border border-gray-100 hover:border-orange-300"
                  >
                    <Phone className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">
                      024 900 3832
                    </span>
                  </a>
                  <a
                    href="https://wa.me/233249003832"
                    target="_blank"
                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-all group border border-gray-100 hover:border-orange-300"
                  >
                    <Mail className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">
                      WhatsApp Us
                    </span>
                  </a>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Tema, Gbestile, Ghana
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
