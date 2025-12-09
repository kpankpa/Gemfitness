'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { motion } from 'framer-motion';
import QRScanner from '@/components/QRScanner';
import WebcamQRScanner from '@/components/WebcamQRScanner';
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
  Camera,
  Scan,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';
import type { Member } from '@/types';
import { printRegistrationReceipt, generateReceiptNumber } from '@/lib/receipt-printer';

// Mock data for features not yet implemented (Payments)
const mockStats = {
  revenue: 45680,
  pendingPayments: 12,
  revenueGrowth: '+15%',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { members, isLoading: _membersLoading, fetchMembers, searchMembers } = useMembers();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { checkIns, stats: checkInStats, isLoading: checkInsLoading, isCheckingIn, performCheckIn, fetchCheckIns, fetchStats } = useCheckIns();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { analytics, isLoading: analyticsLoading, fetchAnalytics } = useAnalytics();
  
  // Classes and Events state
  const [classes, setClasses] = useState<Array<{
    id: string;
    name: string;
    type: string;
    instructor: string;
    duration: number;
    maxCapacity: number;
    enrolled: number;
    schedule: string;
    color?: string;
    status: string;
  }>>([]);
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    description: string;
    eventDate: string;
    location: string;
    maxAttendees?: number;
    registered: number;
    isFree: boolean;
    price?: number;
    status: string;
    image?: string;
  }>>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Plans and Staff state
  const [plans, setPlans] = useState<Array<{
    id: string;
    name: string;
    slug?: string;
    duration: string | number;
    durationUnit?: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
    status: string;
    popular?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
    activeMembers: number;
    totalRevenue: number;
  }>>([]);
  const [staff, setStaff] = useState<Array<{
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    joinDate: string;
    lastActive: string;
    actionsCount: number;
  }>>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'members' | 'classes' | 'events' | 'attendance' | 'payments' | 'plans' | 'staff' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'card'>('momo');
  
  const loading = authLoading;
  
  // Modal states (TODO: Implement modals for editing members and day passes)
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showMemberModal, setShowMemberModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDayPassModal, setShowDayPassModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Staff modal states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  } | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'RECEPTIONIST' as 'RECEPTIONIST' | 'MANAGER',
    dateOfBirth: '2000-01-01',
  });
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Plan modal states
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [showChangeHistoryModal, setShowChangeHistoryModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    slug?: string;
    description: string | null;
    price: number;
    duration: number | string;
    durationUnit?: string;
    features: string[];
    status: string;
    isPopular?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
    popular?: boolean;
    currency?: string;
    activeMembers?: number;
    totalRevenue?: number;
  } | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    duration: 30,
    durationUnit: 'days',
    features: [] as string[],
    isPopular: false,
    isFeatured: false,
    displayOrder: 0,
  });
  const [newFeature, setNewFeature] = useState('');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [changeHistory, setChangeHistory] = useState<Array<{
    id: string;
    changeType: string;
    description: string;
    createdAt: string;
    changedBy: string;
  }>>([]);

  // Attendance filter states
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [filteredCheckIns, setFilteredCheckIns] = useState<typeof checkIns>([]);

  // Member edit modal states
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editMemberFormData, setEditMemberFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    fitnessGoals: '',
    medicalConditions: '',
  });
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [memberEditError, setMemberEditError] = useState<string | null>(null);

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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMode, setCheckInMode] = useState<'search' | 'scanner' | 'camera'>('search');
  const [showWebcamScanner, setShowWebcamScanner] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredMemberData, setRegisteredMemberData] = useState<any>(null);

  // Class modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: '',
    description: '',
    type: '',
    instructor: '',
    duration: '',
    maxCapacity: '20',
    schedule: '',
    color: 'from-orange-400 to-orange-600',
    status: 'ACTIVE'
  });
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  // Event modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    endDate: '',
    location: 'GemFitness Tema',
    image: '',
    maxAttendees: '',
    isFree: true,
    price: '',
    status: 'UPCOMING'
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // Fetch initial data when authenticated (run ONCE on mount)
  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered:', { isAuthenticated, authLoading, userRole: user?.role });
    
    if (!isAuthenticated) {
      if (!authLoading) {
        console.log('⚠️ Not authenticated, redirecting to login');
        router.push('/admin/login');
      }
      return;
    }

    // Check if user has admin role
    if (user && !['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(user.role)) {
      console.log('⚠️ User role not authorized:', user.role);
      router.push('/admin/login');
      return;
    }

    // Load initial data
    console.log('✅ Loading dashboard data...');
    fetchMembers(20);
    fetchCheckIns();
    fetchStats();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, user?.role, router]);

  // Auto-refresh check-ins and stats every 30 seconds when on check-in tab
  useEffect(() => {
    if (isAuthenticated && activeTab === 'checkin') {
      const interval = setInterval(() => {
        fetchCheckIns();
        fetchStats();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab]);

  // Fetch appropriate data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (activeTab === 'checkin' || activeTab === 'members') {
      fetchMembers(); // Fetch all members
    }
    
    if (activeTab === 'classes') {
      fetchClasses();
    }
    
    if (activeTab === 'events') {
      fetchEvents();
    }
    
    if (activeTab === 'plans') {
      fetchPlans();
    }
    
    if (activeTab === 'staff') {
      fetchStaff();
    }

    if (activeTab === 'attendance') {
      setFilteredCheckIns(checkIns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  // Fetch classes from API
  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Fetch events from API
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Fetch plans from API
  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      console.log('Plans API response:', data);
      console.log('Plans array:', data.plans);
      if (data.success) {
        setPlans(data.plans);
        console.log('Plans state updated:', data.plans.length, 'plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Fetch staff from API
  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      if (data.success) {
        setStaff(data.staff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Fetch plan change history
  const fetchPlanHistory = async (planId: string) => {
    try {
      const response = await fetch(`/api/plans/${planId}`);
      const data = await response.json();
      if (data.success && data.plan.changeHistory) {
        setChangeHistory(data.plan.changeHistory);
        setShowChangeHistoryModal(true);
      }
    } catch (error) {
      console.error('Error fetching plan history:', error);
    }
  };

  // Handle add staff member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingStaff(true);
    setStaffError(null);

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddStaffModal(false);
        setStaffFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'RECEPTIONIST',
          dateOfBirth: '2000-01-01',
        });
        fetchStaff(); // Refresh staff list
      } else {
        setStaffError(data.error || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      setStaffError('Failed to add staff member');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Handle edit staff member
  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsSubmittingStaff(true);
    setStaffError(null);

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditStaffModal(false);
        setSelectedStaff(null);
        setStaffFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'RECEPTIONIST',
          dateOfBirth: '2000-01-01',
        });
        fetchStaff(); // Refresh staff list
      } else {
        setStaffError(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setStaffError('Failed to update staff member');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Handle delete staff member
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setIsSubmittingStaff(true);
    setStaffError(null);

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteStaffModal(false);
        setSelectedStaff(null);
        fetchStaff(); // Refresh staff list
      } else {
        setStaffError(data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setStaffError('Failed to delete staff member');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Handle add plan
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddPlanModal(false);
        setPlanFormData({
          name: '',
          slug: '',
          description: '',
          price: 0,
          duration: 30,
          durationUnit: 'days',
          features: [],
          isPopular: false,
          isFeatured: false,
          displayOrder: 0,
        });
        fetchPlans();
      } else {
        setPlanError(data.error || 'Failed to create plan');
      }
    } catch (error) {
      setPlanError('An error occurred while creating plan');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle edit plan
  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmittingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditPlanModal(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        setPlanError(data.error || 'Failed to update plan');
      }
    } catch (error) {
      setPlanError('An error occurred while updating plan');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle delete plan
  const handleDeletePlan = async () => {
    if (!selectedPlan) return;

    setIsSubmittingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch(`/api/plans/${selectedPlan.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeletePlanModal(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        setPlanError(data.error || 'Failed to archive plan');
      }
    } catch (error) {
      setPlanError('An error occurred while archiving plan');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Handle toggle plan status
  const handleTogglePlanStatus = async (plan: typeof selectedPlan) => {
    if (!plan) return;

    try {
      const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  // Add feature to plan form
  const handleAddFeature = () => {
    if (newFeature.trim() && planFormData.features.length < 20) {
      setPlanFormData({
        ...planFormData,
        features: [...planFormData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  // Remove feature from plan form
  const handleRemoveFeature = (index: number) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index),
    });
  };

  // Apply attendance filters
  const handleApplyAttendanceFilter = () => {
    if (!attendanceStartDate && !attendanceEndDate) {
      setFilteredCheckIns(checkIns);
      return;
    }

    const filtered = checkIns.filter((checkin) => {
      const checkinDate = new Date(checkin.time);
      const start = attendanceStartDate ? new Date(attendanceStartDate) : null;
      const end = attendanceEndDate ? new Date(attendanceEndDate) : null;

      if (start && end) {
        return checkinDate >= start && checkinDate <= end;
      } else if (start) {
        return checkinDate >= start;
      } else if (end) {
        return checkinDate <= end;
      }
      return true;
    });

    setFilteredCheckIns(filtered);
  };

  // Export attendance to CSV
  const handleExportAttendance = () => {
    const dataToExport = filteredCheckIns.length > 0 ? filteredCheckIns : checkIns;
    
    const csvContent = [
      ['Time', 'Member', 'Member ID', 'Method', 'Status'].join(','),
      ...dataToExport.map(checkin => [
        checkin.time,
        checkin.member,
        checkin.member,
        checkin.method,
        'Valid'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle edit member
  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMember(true);
    setMemberEditError(null);

    try {
      const response = await fetch(`/api/members/${editMemberFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMemberFormData),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditMemberModal(false);
        setSelectedMember(null);
        fetchMembers();
      } else {
        setMemberEditError(data.error || 'Failed to update member');
      }
    } catch (error) {
      console.error('Edit member error:', error);
      setMemberEditError('An error occurred while updating member');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  // Open edit member modal
  const openEditMemberModal = (member: Member) => {
    setSelectedMember(member);
    setEditMemberFormData({
      id: member.id,
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth || '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      fitnessGoals: member.fitnessGoals || '',
      medicalConditions: member.medicalConditions || '',
    });
    setShowEditMemberModal(true);
  };

  // Open edit staff modal
  const openEditStaffModal = (staffMember: typeof staff[0]) => {
    setSelectedStaff({
      id: staffMember.id,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
    });
    setStaffFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      password: '', // Leave empty - only update if changed
      role: staffMember.role as 'RECEPTIONIST' | 'MANAGER',
      dateOfBirth: '2000-01-01',
    });
    setStaffError(null);
    setShowEditStaffModal(true);
  };

  // Open delete staff modal
  const openDeleteStaffModal = (staffMember: typeof staff[0]) => {
    setSelectedStaff({
      id: staffMember.id,
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
    });
    setStaffError(null);
    setShowDeleteStaffModal(true);
  };

  const handleLogout = async () => {
    await logout();
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
        // Store registered member data for receipt
        setRegisteredMemberData({
          ...data.user,
          plan: newMember.plan,
          registrationType: newMember.registrationType
        });
        setRegistrationSuccess(true);
        
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

  // Handle print receipt and close registration modal
  const handlePrintReceipt = () => {
    if (!registeredMemberData) return;

    const planDetails = {
      'ONE_MONTH': { name: 'Monthly', price: 200, duration: '1 Month' },
      'THREE_MONTHS': { name: 'Quarterly', price: 450, duration: '3 Months' },
      'SIX_MONTHS': { name: 'Semi-Annual', price: 1000, duration: '6 Months' },
      'TWELVE_MONTHS': { name: 'Annual', price: 2000, duration: '12 Months' },
      'DAILY': { name: 'Daily Walk-In', price: 50, duration: '1 Day' },
    };

    const regFees = {
      'SINGLE': 250,
      'COUPLE': 400,
      'FAMILY': 1000,
    };

    const plan = planDetails[registeredMemberData.plan as keyof typeof planDetails];
    const regFee = regFees[registeredMemberData.registrationType as keyof typeof regFees] || 250;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    printRegistrationReceipt({
      receiptNumber: generateReceiptNumber(),
      memberName: `${registeredMemberData.firstName} ${registeredMemberData.lastName}`,
      memberId: registeredMemberData.id,
      email: registeredMemberData.email,
      phone: registeredMemberData.phone,
      registrationType: registeredMemberData.registrationType,
      registrationFee: regFee,
      membershipPlan: plan.name,
      planPrice: plan.price,
      planDuration: plan.duration,
      firstPaymentDate: nextMonth.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMethod: 'CASH', // Default, can be changed
      qrCode: registeredMemberData.qrCode || 'N/A',
      receivedBy: user?.email || 'Receptionist',
    });
  };

  // Close registration modal and reset
  const closeRegistrationModal = () => {
    setShowNewMemberModal(false);
    setRegistrationSuccess(false);
    setRegisteredMemberData(null);
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
  };

  // Open class modal for creating or editing
  const openClassModal = (classData?: any) => {
    if (classData) {
      // Edit mode
      setEditingClass(classData.id);
      setClassFormData({
        name: classData.name,
        description: classData.description || '',
        type: classData.type,
        instructor: classData.instructor,
        duration: classData.duration.toString(),
        maxCapacity: classData.maxCapacity.toString(),
        schedule: classData.schedule,
        color: classData.color || 'from-orange-400 to-orange-600',
        status: classData.status
      });
    } else {
      // Create mode
      setEditingClass(null);
      setClassFormData({
        name: '',
        description: '',
        type: '',
        instructor: '',
        duration: '',
        maxCapacity: '20',
        schedule: '',
        color: 'from-orange-400 to-orange-600',
        status: 'ACTIVE'
      });
    }
    setClassError(null);
    setShowClassModal(true);
  };

  // Close class modal
  const closeClassModal = () => {
    setShowClassModal(false);
    setEditingClass(null);
    setClassError(null);
    setClassFormData({
      name: '',
      description: '',
      type: '',
      instructor: '',
      duration: '',
      maxCapacity: '20',
      schedule: '',
      color: 'from-orange-400 to-orange-600',
      status: 'ACTIVE'
    });
  };

  // Save class (create or update)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClass(true);
    setClassError(null);

    try {
      const url = editingClass 
        ? `/api/classes/${editingClass}` 
        : '/api/classes';
      
      const method = editingClass ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classFormData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchClasses();
        closeClassModal();
        alert(editingClass ? '✅ Class updated successfully!' : '✅ Class created successfully!');
      } else {
        setClassError(data.error || 'Failed to save class');
      }
    } catch (error) {
      console.error('Error saving class:', error);
      setClassError('Failed to save class. Please try again.');
    } finally {
      setIsSavingClass(false);
    }
  };

  // Delete class
  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchClasses();
        alert('✅ Class deleted successfully!');
      } else {
        alert('❌ Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('❌ Error deleting class');
    }
  };

  // Open event modal for creating or editing
  const openEventModal = (eventData?: any) => {
    if (eventData) {
      // Edit mode
      setEditingEvent(eventData.id);
      const eventDate = new Date(eventData.eventDate);
      const endDate = eventData.endDate ? new Date(eventData.endDate) : null;
      setEventFormData({
        title: eventData.title,
        description: eventData.description,
        eventDate: eventDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : '',
        location: eventData.location || 'GemFitness Tema',
        image: eventData.image || '',
        maxAttendees: eventData.maxAttendees?.toString() || '',
        isFree: eventData.isFree,
        price: eventData.price?.toString() || '',
        status: eventData.status
      });
    } else {
      // Create mode
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        eventDate: '',
        endDate: '',
        location: 'GemFitness Tema',
        image: '',
        maxAttendees: '',
        isFree: true,
        price: '',
        status: 'UPCOMING'
      });
    }
    setEventError(null);
    setShowEventModal(true);
  };

  // Close event modal
  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventError(null);
    setEventFormData({
      title: '',
      description: '',
      eventDate: '',
      endDate: '',
      location: 'GemFitness Tema',
      image: '',
      maxAttendees: '',
      isFree: true,
      price: '',
      status: 'UPCOMING'
    });
  };

  // Save event (create or update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    setEventError(null);

    try {
      const url = editingEvent 
        ? `/api/events/${editingEvent}` 
        : '/api/events';
      
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventFormData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchEvents();
        closeEventModal();
        alert(editingEvent ? '✅ Event updated successfully!' : '✅ Event created successfully!');
      } else {
        setEventError(data.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setEventError('Failed to save event. Please try again.');
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also cancel all registrations.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchEvents();
        alert('✅ Event deleted successfully!');
      } else {
        alert(`❌ ${data.error || 'Failed to delete event'}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('❌ Error deleting event');
    }
  };

  // Handle check-in
  const handleCheckIn = async (overrideData?: { qrCode?: string; method?: 'qr' | 'manual' }) => {
    const dataToSend = overrideData || checkInData;

    // Validate QR code
    if (!dataToSend.qrCode) {
      alert('❌ Error: No QR code found for this member');
      return;
    }

    try {
      const result = await performCheckIn({
        qrCode: dataToSend.qrCode,
        method: dataToSend.method || 'qr',
        checkedBy: user?.email || 'system'
      });

      if (result.success) {
        alert(`✅ Check-in successful for ${result.checkIn?.member}!`);
        setShowCheckInModal(false);
        setCheckInData({ qrCode: '', memberId: '', method: 'qr' });
        
        // Refresh analytics
        await fetchAnalytics();
      } else {
        alert(`❌ ${result.error || 'Failed to check-in'}`);
      }
    } catch (error) {
      console.error('❌ Check-in error:', error);
      alert('❌ Failed to check-in. Please check your connection and try again.');
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
  const filteredMembers = searchQuery ? searchMembers(searchQuery) : members;
  
  if (searchQuery && members.length > 0) {
    console.log('📊 Search Results:', {
      searchQuery,
      totalMembers: members.length,
      filteredCount: filteredMembers.length,
      memberNames: members.map(m => m.name)
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {loading ? (
        <div className="flex items-center justify-center w-full h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
                { label: 'Total Members', value: members.length.toLocaleString() || '0', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', visible: true },
                { label: 'Active Members', value: members.filter(m => m.status === 'active').length.toLocaleString() || '0', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', visible: true },
                { label: 'Expiring Soon', value: analytics?.expiringSoon?.toString() || '0', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', visible: true },
                { label: 'Checked In Today', value: analytics?.todayCheckIns?.toString() || '0', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50', visible: true },
                { label: 'Revenue (GH₵)', value: canViewFinancials ? analytics?.monthlyRevenue?.toLocaleString() || '0' : '***', icon: DollarSign, color: 'text-orange-500', bg: 'bg-orange-50', visible: canViewFinancials },
                { label: 'Attendance Rate', value: analytics?.attendanceRate || '0%', icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50', visible: true },
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
              {analytics?.expiringSoon > 0 ? (
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
                    {members.filter(m => m.status === 'expiring_soon').length > 3 && (
                      <Button variant="outline" className="w-full mt-4 border-2" onClick={() => setActiveTab('members')}>
                        View All Expiring
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg sm:text-xl text-green-900">All Good!</CardTitle>
                    </div>
                    <CardDescription className="text-green-700">No memberships expiring soon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <Trophy className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-green-800 text-sm">All active memberships are valid for more than 3 days</p>
                    </div>
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
                  {checkIns.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {checkIns.slice(0, 5).map((checkin) => (
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
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm mb-4">No check-ins yet today</p>
                      <Button onClick={() => setActiveTab('checkin')} className="bg-orange-500 hover:bg-orange-600">
                        <QrCode className="h-4 w-4 mr-2" />
                        Check In Members
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Members */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Members</CardTitle>
                <CardDescription>Latest member registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {members.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.phone} • {member.plan}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            member.status === 'active' ? 'bg-green-100 text-green-700' :
                            member.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {member.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => setActiveTab('members')} variant="outline" className="w-full mt-4 border-2">
                      View All Members ({analytics?.totalMembers || 0})
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No members registered yet</p>
                    {canRegisterMember && (
                      <Button onClick={() => setShowNewMemberModal(true)} className="bg-orange-500 hover:bg-orange-600">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Register First Member
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                                  setSelectedMember(member as Member);
                                  setShowMemberModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canUpdateBasicInfo && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditMemberModal(member as Member)}
                                >
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
                    <Button 
                      onClick={() => openClassModal()}
                      className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add New Class
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingClasses ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading classes...</p>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No classes found. Create your first class!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => (
                    <Card key={classItem.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${classItem.color} flex items-center justify-center`}>
                            <Dumbbell className="h-6 w-6 text-white" />
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            classItem.status?.toUpperCase() === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => openClassModal(classItem)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClass(classItem.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                )}
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
                    <Button 
                      onClick={() => openEventModal()}
                      className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Create New Event
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No events found. Create your first event!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
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
                                event.status?.toUpperCase() === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                event.status?.toUpperCase() === 'ONGOING' ? 'bg-green-100 text-green-700' :
                                event.status?.toUpperCase() === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {event.status?.toUpperCase()}
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openEventModal(event)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
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
                )}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Member Check-In</CardTitle>
                  <CardDescription>Choose your preferred check-in method</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    fetchCheckIns();
                    fetchStats();
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Check-In Method Tabs */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setCheckInMode('search')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                        checkInMode === 'search'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Search className="h-5 w-5" />
                      <span>Manual Search</span>
                    </button>
                    <button
                      onClick={() => setCheckInMode('scanner')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                        checkInMode === 'scanner'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Scan className="h-5 w-5" />
                      <span>QR Scanner</span>
                    </button>
                    <button
                      onClick={() => setCheckInMode('camera')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                        checkInMode === 'camera'
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Camera className="h-5 w-5" />
                      <span>Camera Scan</span>
                    </button>
                  </div>

                  {/* Manual Search Mode */}
                  {checkInMode === 'search' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, phone number, or member ID..."
                          className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          autoFocus
                        />
                      </div>
                      
                      {/* Search Results with Check-In Buttons */}
                      {searchQuery && filteredMembers.length > 0 && (
                        <div className="border-2 border-gray-200 rounded-xl divide-y max-h-96 overflow-y-auto">
                          {filteredMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <p className="font-semibold text-gray-900 text-lg">{member.name}</p>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    member.status === 'active' ? 'bg-green-100 text-green-700' :
                                    member.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {member.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  <Phone className="inline h-3 w-3 mr-1" />
                                  {member.phone}
                                  <span className="mx-2">•</span>
                                  <Mail className="inline h-3 w-3 mr-1" />
                                  {member.email}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 font-mono">ID: {member.qrCode?.slice(0, 20)}...</p>
                              </div>
                              <Button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  
                                  console.log('🖱️ Check-in button clicked for member:', {
                                    name: member.name,
                                    qrCode: member.qrCode,
                                    status: member.status,
                                    isCheckingIn: isCheckingIn
                                  });
                                  
                                  if (isCheckingIn) {
                                    console.log('⏸️ Already checking in, please wait...');
                                    return;
                                  }
                                  
                                  if (member.status === 'expired') {
                                    alert('❌ Cannot check-in: Member subscription has expired');
                                    return;
                                  }
                                  
                                  if (!member.qrCode) {
                                    console.error('❌ Member has no QR code!', member);
                                    alert('❌ Error: This member has no QR code');
                                    return;
                                  }
                                  
                                  console.log('✅ Calling handleCheckIn with qrCode:', member.qrCode);
                                  await handleCheckIn({ qrCode: member.qrCode, method: 'manual' });
                                }}
                                disabled={isCheckingIn || member.status === 'expired'}
                                className={`ml-4 ${
                                  member.status === 'expired' 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-500 hover:bg-green-600'
                                }`}
                                size="lg"
                              >
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                Check In
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {searchQuery && filteredMembers.length === 0 && (
                        <div className="border-2 border-red-200 bg-red-50 rounded-xl p-8 text-center">
                          <UserX className="h-16 w-16 text-red-400 mx-auto mb-3" />
                          <p className="font-semibold text-red-900 text-lg mb-1">Member Not Found</p>
                          <p className="text-sm text-red-600 mb-4">No member matches &quot;{searchQuery}&quot;</p>
                          {canRegisterMember && (
                            <Button 
                              onClick={() => setShowNewMemberModal(true)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Register New Member
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Instructions when no search */}
                      {!searchQuery && (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 text-lg font-medium mb-2">Start typing to search for members</p>
                          <p className="text-gray-500 text-sm">Search by name, phone number, or member ID</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Scanner Mode (Barcode Scanner Device) */}
                  {checkInMode === 'scanner' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center mb-4">
                        <Scan className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-blue-900 mb-2">USB/Bluetooth Barcode Scanner</h3>
                        <p className="text-sm text-blue-700">
                          Use a physical barcode scanner device to scan member QR codes
                        </p>
                      </div>
                      <QRScanner 
                        onScan={async (qrCode) => {
                          setCheckInData({ ...checkInData, qrCode, method: 'qr' });
                          await handleCheckIn({ qrCode, method: 'qr' });
                        }}
                        onError={(error) => {
                          alert(`❌ ${error}`);
                        }}
                        placeholder="Scan or enter member QR code"
                      />
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 text-center">
                          <strong>How to use:</strong> Click &quot;Activate Scanner&quot; and point your barcode scanner at the member&apos;s QR code. 
                          The scanner will automatically input the code and check them in.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Camera Scanner Mode */}
                  {checkInMode === 'camera' && (
                    <div className="space-y-4">
                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-8 text-center">
                        <Camera className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-purple-900 text-lg mb-2">Webcam QR Scanner</h3>
                        <p className="text-sm text-purple-700 mb-6">
                          Use your device&apos;s camera to scan QR codes from member phones or printed cards
                        </p>
                        <Button
                          onClick={() => setShowWebcamScanner(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                          size="lg"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-xs text-yellow-800 text-center">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          <strong>Note:</strong> Camera scanning requires browser permission and works best with good lighting.
                          For faster check-ins, use Manual Search or Barcode Scanner methods.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick Check-In Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t-2">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-700">{checkInStats.today}</div>
                      <div className="text-xs text-gray-600 font-medium">Today</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-700">{checkInStats.activeNow}</div>
                      <div className="text-xs text-gray-600 font-medium">Active Now</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-700">{checkInStats.thisWeek}</div>
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
                {checkIns.length > 0 ? (
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
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{checkin.memberId}</td>
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
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">No check-ins today yet</p>
                    <p className="text-sm text-gray-400">Check-ins will appear here as members arrive</p>
                  </div>
                )}
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
                  <Button 
                    variant="outline" 
                    className="border-2"
                    onClick={handleExportAttendance}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Date Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input 
                    type="date" 
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
                  />
                  <input 
                    type="date" 
                    value={attendanceEndDate}
                    onChange={(e) => setAttendanceEndDate(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
                  />
                  <Button 
                    variant="outline" 
                    className="border-2"
                    onClick={handleApplyAttendanceFilter}
                  >
                    Apply Filter
                  </Button>
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
                      {(filteredCheckIns.length > 0 ? filteredCheckIns : checkIns).map((checkin) => (
                        <tr key={checkin.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{checkin.time}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{checkin.member}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{checkin.member}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              checkin.method === 'qr' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {checkin.method.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">System</td>
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
                  <Button 
                    onClick={() => {
                      setPlanFormData({
                        name: '',
                        slug: '',
                        description: '',
                        price: 0,
                        duration: 30,
                        durationUnit: 'days',
                        features: [],
                        isPopular: false,
                        isFeatured: false,
                        displayOrder: 0,
                      });
                      setShowAddPlanModal(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  >
                    <Package className="mr-2 h-5 w-5" />
                    Add New Plan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPlans ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading plans...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No membership plans available.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                      <Card key={plan.id} className={`border-2 transition-colors ${
                        plan.popular ? 'border-orange-400 shadow-lg' : 'border-gray-200 hover:border-orange-300'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              plan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                              plan.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {plan.status}
                            </span>
                          </div>
                          {plan.popular && (
                            <div className="mb-3">
                              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                                Most Popular
                              </span>
                            </div>
                          )}
                          <div className="mb-4">
                            <span className="text-3xl font-bold text-orange-600">{plan.currency} {plan.price}</span>
                            <span className="text-gray-600 ml-2">/ {plan.duration}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <div className="pt-4 border-t border-gray-200 space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Active Members:</span>
                              <span className="font-semibold text-gray-900">{plan.activeMembers}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total Revenue:</span>
                              <span className="font-semibold text-gray-900">{plan.currency} {plan.totalRevenue.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setPlanFormData({
                                    name: plan.name,
                                    slug: plan.slug || '',
                                    description: plan.description || '',
                                    price: plan.price,
                                    duration: typeof plan.duration === 'number' ? plan.duration : 30,
                                    durationUnit: plan.durationUnit || 'days',
                                    features: plan.features,
                                    isPopular: plan.popular || false,
                                    isFeatured: plan.isFeatured || false,
                                    displayOrder: plan.displayOrder || 0,
                                  });
                                  setShowEditPlanModal(true);
                                }}
                                size="sm"
                                variant="outline"
                                className="flex-1 border-2"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleTogglePlanStatus(plan)}
                                size="sm"
                                variant="outline"
                                className={`flex-1 border-2 ${
                                  plan.status === 'ACTIVE' 
                                    ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' 
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                                }`}
                              >
                                {plan.status === 'ACTIVE' ? (
                                  <><Ban className="h-4 w-4 mr-1" /> Disable</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-1" /> Enable</>
                                )}
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => fetchPlanHistory(plan.id)}
                                size="sm"
                                variant="outline"
                                className="flex-1 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                History
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setShowDeletePlanModal(true);
                                }}
                                size="sm"
                                variant="outline"
                                className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                  <Button 
                    onClick={() => {
                      setStaffFormData({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        password: '',
                        role: 'RECEPTIONIST',
                        dateOfBirth: '2000-01-01',
                      });
                      setStaffError(null);
                      setShowAddStaffModal(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                  >
                    <UserCog className="mr-2 h-5 w-5" />
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStaff ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading staff...</p>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No staff members found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Join Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {staff.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{member.phone}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                                member.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : member.role === 'MANAGER'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-cyan-100 text-cyan-700'
                              }`}>
                                {member.role.toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{member.joinDate}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  title="Edit staff member"
                                  onClick={() => openEditStaffModal(member)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700" 
                                  title="Delete staff member"
                                  onClick={() => openDeleteStaffModal(member)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

      {/* Edit Member Modal */}
      {showEditMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Member: {selectedMember.name}</h2>
              {memberEditError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {memberEditError}
                </div>
              )}
              <form onSubmit={handleEditMember} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={editMemberFormData.firstName}
                      onChange={(e) => setEditMemberFormData({ ...editMemberFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editMemberFormData.lastName}
                      onChange={(e) => setEditMemberFormData({ ...editMemberFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editMemberFormData.email}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editMemberFormData.phone}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editMemberFormData.dateOfBirth}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={editMemberFormData.address}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editMemberFormData.emergencyContact}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editMemberFormData.emergencyPhone}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, emergencyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditMemberModal(false);
                      setSelectedMember(null);
                      setMemberEditError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingMember}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isUpdatingMember ? 'Updating...' : 'Update Member'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Member Registration Modal */}
      {showNewMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            {registrationSuccess ? (
              /* Success View with Print Receipt */
              <div className="text-center py-8">
                <div className="mb-6">
                  <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
                  <p className="text-gray-600 mb-1">Member has been registered successfully</p>
                  <p className="text-sm text-gray-500">Member ID: {registeredMemberData?.id}</p>
                  <p className="text-sm text-gray-500">QR Code: {registeredMemberData?.qrCode}</p>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p className="font-semibold text-orange-900">Print Receipt for Customer</p>
                  </div>
                  <p className="text-sm text-orange-700">Please print the receipt and hand it to the customer before they leave.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handlePrintReceipt}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Print Receipt
                  </Button>
                  <Button
                    onClick={() => {
                      handlePrintReceipt();
                      setTimeout(closeRegistrationModal, 500);
                    }}
                    variant="outline"
                    className="w-full border-2"
                  >
                    Print & Close
                  </Button>
                  <Button
                    onClick={closeRegistrationModal}
                    variant="ghost"
                    className="w-full"
                  >
                    Skip & Close
                  </Button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <>
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
            </>
            )}
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Member Check-In</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-4">
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

      {/* Webcam QR Scanner Modal */}
      {showWebcamScanner && (
        <WebcamQRScanner
          onScan={async (qrCode) => {
            setShowWebcamScanner(false);
            await handleCheckIn({ qrCode, method: 'qr' });
          }}
          onClose={() => setShowWebcamScanner(false)}
        />
      )}

      {/* Class Modal (Create/Edit) */}
      {showClassModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeClassModal();
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h2>
              {classError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {classError}
                </div>
              )}
              <form onSubmit={handleSaveClass} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Class Name *</label>
                    <input
                      type="text"
                      required
                      value={classFormData.name}
                      onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                      placeholder="e.g., Weight Training"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Class Type *</label>
                    <select
                      required
                      value={classFormData.type}
                      onChange={(e) => setClassFormData({ ...classFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Type</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Yoga">Yoga</option>
                      <option value="Dance">Dance</option>
                      <option value="Boxing">Boxing</option>
                      <option value="Cycling">Cycling</option>
                      <option value="Pilates">Pilates</option>
                      <option value="CrossFit">CrossFit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={classFormData.description}
                    onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                    placeholder="Brief description of the class..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor *</label>
                    <input
                      type="text"
                      required
                      value={classFormData.instructor}
                      onChange={(e) => setClassFormData({ ...classFormData, instructor: e.target.value })}
                      placeholder="Coach name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="180"
                      value={classFormData.duration}
                      onChange={(e) => setClassFormData({ ...classFormData, duration: e.target.value })}
                      placeholder="e.g., 60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Capacity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={classFormData.maxCapacity}
                      onChange={(e) => setClassFormData({ ...classFormData, maxCapacity: e.target.value })}
                      placeholder="e.g., 20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={classFormData.status}
                      onChange={(e) => setClassFormData({ ...classFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Schedule *</label>
                  <input
                    type="text"
                    required
                    value={classFormData.schedule}
                    onChange={(e) => setClassFormData({ ...classFormData, schedule: e.target.value })}
                    placeholder="e.g., Mon, Wed, Fri - 6:30 AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Specify days and time (e.g., "Mon, Wed, Fri - 6:30 AM")</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Card Color</label>
                  <select
                    value={classFormData.color}
                    onChange={(e) => setClassFormData({ ...classFormData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="from-orange-400 to-orange-600">Orange</option>
                    <option value="from-blue-400 to-blue-600">Blue</option>
                    <option value="from-green-400 to-green-600">Green</option>
                    <option value="from-purple-400 to-purple-600">Purple</option>
                    <option value="from-pink-400 to-pink-600">Pink</option>
                    <option value="from-red-400 to-red-600">Red</option>
                    <option value="from-yellow-400 to-yellow-600">Yellow</option>
                    <option value="from-indigo-400 to-indigo-600">Indigo</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeClassModal}
                    disabled={isSavingClass}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingClass}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSavingClass ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal (Create/Edit) */}
      {showEventModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEventModal();
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              {eventError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {eventError}
                </div>
              )}
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    placeholder="e.g., Summer Fitness Challenge"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    required
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    placeholder="Describe the event..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={eventFormData.eventDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                    <input
                      type="date"
                      value={eventFormData.endDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      placeholder="e.g., GemFitness Tema"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Attendees</label>
                    <input
                      type="number"
                      min="1"
                      value={eventFormData.maxAttendees}
                      onChange={(e) => setEventFormData({ ...eventFormData, maxAttendees: e.target.value })}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={eventFormData.image}
                    onChange={(e) => setEventFormData({ ...eventFormData, image: e.target.value })}
                    placeholder="https://example.com/event-banner.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a URL to an event banner or poster image</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={eventFormData.isFree}
                      onChange={(e) => setEventFormData({ ...eventFormData, isFree: e.target.checked, price: e.target.checked ? '' : eventFormData.price })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="isFree" className="text-sm font-medium">This is a free event</label>
                  </div>

                  {!eventFormData.isFree && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Ticket Price (GH₵) *</label>
                      <input
                        type="number"
                        required={!eventFormData.isFree}
                        min="0"
                        step="0.01"
                        value={eventFormData.price}
                        onChange={(e) => setEventFormData({ ...eventFormData, price: e.target.value })}
                        placeholder="e.g., 50.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEventModal}
                    disabled={isSavingEvent}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingEvent}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSavingEvent ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Staff Member</h2>
              {staffError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {staffError}
                </div>
              )}
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={staffFormData.firstName}
                      onChange={(e) => setStaffFormData({ ...staffFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={staffFormData.lastName}
                      onChange={(e) => setStaffFormData({ ...staffFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    required
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as 'RECEPTIONIST' | 'MANAGER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddStaffModal(false);
                      setStaffError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingStaff}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmittingStaff ? 'Adding...' : 'Add Staff'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {showEditStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Staff Member</h2>
              {staffError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {staffError}
                </div>
              )}
              <form onSubmit={handleEditStaff} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={staffFormData.firstName}
                      onChange={(e) => setStaffFormData({ ...staffFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={staffFormData.lastName}
                      onChange={(e) => setStaffFormData({ ...staffFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    minLength={6}
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                    placeholder="Enter new password or leave empty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    required
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as 'RECEPTIONIST' | 'MANAGER' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditStaffModal(false);
                      setSelectedStaff(null);
                      setStaffError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingStaff}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmittingStaff ? 'Updating...' : 'Update Staff'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {showDeleteStaffModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold">Delete Staff Member</h2>
              </div>
              {staffError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {staffError}
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{selectedStaff.firstName} {selectedStaff.lastName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteStaffModal(false);
                    setSelectedStaff(null);
                    setStaffError(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteStaff}
                  disabled={isSubmittingStaff}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isSubmittingStaff ? 'Deleting...' : 'Delete Staff'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Plan</h2>
              {planError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {planError}
                </div>
              )}
              <form onSubmit={handleAddPlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Name *</label>
                    <input
                      type="text"
                      value={planFormData.name}
                      onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug (Uppercase, e.g., ONE_MONTH) *</label>
                    <input
                      type="text"
                      value={planFormData.slug}
                      onChange={(e) => setPlanFormData({ ...planFormData, slug: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (GH₵) *</label>
                    <input
                      type="number"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration *</label>
                    <input
                      type="number"
                      value={planFormData.duration}
                      onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit *</label>
                    <select
                      value={planFormData.durationUnit}
                      onChange={(e) => setPlanFormData({ ...planFormData, durationUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Features (Max 20)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Add a feature..."
                    />
                    <Button type="button" onClick={handleAddFeature} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {planFormData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={planFormData.isPopular}
                      onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="isPopular" className="text-sm font-medium">Popular</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={planFormData.isFeatured}
                      onChange={(e) => setPlanFormData({ ...planFormData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="isFeatured" className="text-sm font-medium">Featured</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={planFormData.displayOrder}
                      onChange={(e) => setPlanFormData({ ...planFormData, displayOrder: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      max="999"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddPlanModal(false);
                      setPlanError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPlan}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmittingPlan ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditPlanModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Plan: {selectedPlan.name}</h2>
              {planError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {planError}
                </div>
              )}
              <form onSubmit={handleEditPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (GH₵)</label>
                    <input
                      type="number"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <input
                      type="number"
                      value={planFormData.duration}
                      onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      value={planFormData.durationUnit}
                      onChange={(e) => setPlanFormData({ ...planFormData, durationUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Features (Max 20)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Add a feature..."
                    />
                    <Button type="button" onClick={handleAddFeature} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {planFormData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsPopular"
                      checked={planFormData.isPopular}
                      onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="editIsPopular" className="text-sm font-medium">Popular</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsFeatured"
                      checked={planFormData.isFeatured}
                      onChange={(e) => setPlanFormData({ ...planFormData, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <label htmlFor="editIsFeatured" className="text-sm font-medium">Featured</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={planFormData.displayOrder}
                      onChange={(e) => setPlanFormData({ ...planFormData, displayOrder: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      min="0"
                      max="999"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditPlanModal(false);
                      setSelectedPlan(null);
                      setPlanError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingPlan}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmittingPlan ? 'Updating...' : 'Update Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {showDeletePlanModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold">Archive Plan</h2>
              </div>
              {planError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {planError}
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Are you sure you want to archive <span className="font-semibold">{selectedPlan.name}</span>? 
                This will prevent new subscriptions but won&apos;t affect existing members.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeletePlanModal(false);
                    setSelectedPlan(null);
                    setPlanError(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePlan}
                  disabled={isSubmittingPlan}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isSubmittingPlan ? 'Archiving...' : 'Archive Plan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change History Modal */}
      {showChangeHistoryModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Change History: {selectedPlan.name}</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {changeHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No change history available</p>
              ) : (
                <div className="space-y-4">
                  {changeHistory.map((change) => (
                    <div key={change.id} className="border-l-4 border-orange-500 pl-4 py-2">
                      <div className="flex items-start justify-between mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          change.changeType === 'CREATED' ? 'bg-green-100 text-green-700' :
                          change.changeType === 'PRICE_CHANGED' ? 'bg-yellow-100 text-yellow-700' :
                          change.changeType === 'STATUS_CHANGED' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {change.changeType}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(change.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{change.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <Button
                onClick={() => {
                  setShowChangeHistoryModal(false);
                  setSelectedPlan(null);
                  setChangeHistory([]);
                }}
                className="w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit Member Details</h2>
              <p className="text-sm text-gray-600 mt-1">Update member information</p>
            </div>
            <form onSubmit={handleEditMember} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {memberEditError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {memberEditError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.firstName}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.lastName}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editMemberFormData.email}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={editMemberFormData.phone}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editMemberFormData.dateOfBirth}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.emergencyContact}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, emergencyContact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={editMemberFormData.emergencyPhone}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, emergencyPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.address}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fitness Goals
                  </label>
                  <textarea
                    value={editMemberFormData.fitnessGoals}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, fitnessGoals: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Conditions
                  </label>
                  <textarea
                    value={editMemberFormData.medicalConditions}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, medicalConditions: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>
              </div>
            </form>
            <div className="p-6 border-t flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowEditMemberModal(false);
                  setSelectedMember(null);
                  setMemberEditError(null);
                }}
                variant="outline"
                className="flex-1"
                disabled={isUpdatingMember}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditMember}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isUpdatingMember}
              >
                {isUpdatingMember ? 'Updating...' : 'Update Member'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
