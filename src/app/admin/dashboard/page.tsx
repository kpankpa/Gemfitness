'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  User,
  TrendingUp,
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
  X,
  XCircle,
  Upload,
  Shield,
  Settings,
  CreditCard,
  Star,
  History,
  Send,
  ChevronDown,
  MoreVertical,
  FileText,
  UserPlus,
  ClipboardCheck,
  LayoutGrid,
  CalendarDays,
  ExternalLink,
  Printer,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { useCheckIns } from '@/hooks/useCheckIns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePaymentAnalytics } from '@/hooks/usePaymentAnalytics';
import QRScanner from '@/components/QRScanner';
import WebcamQRScanner from '@/components/WebcamQRScanner';
import WaitlistModal from '@/components/admin/WaitlistModal';
import BulkEmailModal from '@/components/admin/BulkEmailModal';
import ClassReviewsModal from '@/components/admin/ClassReviewsModal';
import ClassDetailsModal from '@/components/admin/ClassDetailsModal';
import MemberDetailsModal from '@/components/admin/MemberDetailsModal';
import MemberClassHistoryModal from '@/components/admin/MemberClassHistoryModal';
import ClassEnrollmentModal from '@/components/admin/ClassEnrollmentModal';
import ClassAttendanceModal from '@/components/admin/ClassAttendanceModal';
import ClassAnalyticsCards from '@/components/admin/ClassAnalyticsCards';
import EventDetailsModal from '@/components/admin/EventDetailsModal';
import EventAttendeeModal from '@/components/admin/EventAttendeeModal';
import EventAnalyticsCards from '@/components/admin/EventAnalyticsCards';
import EventCalendarView from '@/components/admin/EventCalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PLAN_PRICING } from '@/lib/pricing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminSidebar from '@/components/AdminSidebar';
import ParQManagement from '@/components/admin/ParQManagement';
import ReportsAnalytics from '@/components/admin/ReportsAnalytics';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import AdminSubscriptionManager from '@/components/admin/AdminSubscriptionManager';
import DayPassManager from '@/components/admin/DayPassManager';
import ReceiptsManager from '@/components/admin/ReceiptsManager';
import type { Member } from '@/types';
import { printRegistrationReceipt, generateReceiptNumber } from '@/lib/receipt-printer';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshSession } = useAuth();
  const { members, fetchMembers, currentPage, pageSize, totalMembers } = useMembers();
  const { checkIns, stats: checkInStats, isCheckingIn, performCheckIn, fetchCheckIns, fetchStats } = useCheckIns();
  const { analytics, fetchAnalytics } = useAnalytics();
  const { paymentAnalytics, fetchPaymentAnalytics } = usePaymentAnalytics();

  // Shared pricing constants.
  // Free first month: new members only pay the registration fee upfront.
  // Their chosen plan price kicks in at first renewal (after 30 free days).
  const REG_FEE = 250;
  const getExpectedAmount = (_plan: string) => REG_FEE;
  
  // Classes and Events state
  const [classes, setClasses] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    type: string;
    instructor: string;
    duration: number;
    maxCapacity: number;
    enrolled: number;
    schedule: string;
    color?: string;
    status: string;
    rating?: number;
    waitlistCount?: number;
    totalReviews?: number;
  }>>([]);
  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    description: string;
    eventDate: string;
    endDate?: string | null;
    location: string;
    maxAttendees?: number;
    registered: number;
    isFree: boolean;
    price?: number;
    status: string;
    image?: string;
    category?: string;
    tags?: string[];
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
  const [trainers, setTrainers] = useState<Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    specializations: string[];
    certifications?: string[];
    maxWeeklyHours?: number;
    preferredDays?: string[];
    preferredTimes?: string[];
  }>>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  
  // Plan analytics state
  const [planAnalytics, setPlanAnalytics] = useState<{
    totalActivePlans: number;
    totalActiveSubscriptions: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    newSubscriptionsLast7Days: number;
    newSubscriptionsLast30Days: number;
    expiringInNext30Days: number;
    churnRate: number;
    topPerformingPlan: string;
    revenueBreakdown: Array<{ plan: string; revenue: number; count: number; percentage: number }>;
    planMetrics: Array<{
      plan: string;
      newSubscriptions7Days: number;
      newSubscriptions30Days: number;
      expiringSoon: number;
      renewalRate: number;
    }>;
  } | null>(null);
  
  // Registration fees state
  const [registrationFees, setRegistrationFees] = useState<Array<{
    id: string;
    type: string;
    name: string;
    price: number;
    description: string | null;
    maxMembers: number | null;
    currency: string;
  }>>([]);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'members' | 'classes' | 'events' | 'attendance' | 'payments' | 'receipts' | 'plans' | 'staff' | 'analytics' | 'audit' | 'settings' | 'parq' | 'reports' | 'subscriptions' | 'daypass'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkinSearchQuery, setCheckinSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'card' | 'all'>('all');
  const [paymentHistory, setPaymentHistory] = useState<Array<{
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    transactionType: string | null;
    paidAt: string | null;
    createdAt: string;
    member: {
      id: string;
      name: string;
      email: string;
      plan: string;
    } | null;
    metadata: Record<string, unknown> | null;
  }>>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [attendancePage, setAttendancePage] = useState(1);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [memberToSuspend, setMemberToSuspend] = useState<Member | null>(null);
  const [isSuspending, setIsSuspending] = useState(false);
  
  const loading = authLoading;
  
  // Modal states (TODO: Implement modals for editing members and day passes)
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Day Pass modal states
  const [showDayPassModal, setShowDayPassModal] = useState(false);
  const [isProcessingDayPass, setIsProcessingDayPass] = useState(false);
  const [dayPassPrice, setDayPassPrice] = useState(30);
  const [dayPassSuccess, setDayPassSuccess] = useState(false);
  const [dayPassPending, setDayPassPending] = useState(false);
  const [dayPassRefreshTrigger, setDayPassRefreshTrigger] = useState(0);
  const [dayPassResult, setDayPassResult] = useState<{
    userId?: string;
    firstName: string;
    lastName: string;
    phone: string;
    price: number;
    reference: string;
    expiresAt: string;
    transactionId?: string;
    latePurchaseWarning?: string;
    paymentMethod?: string;
    provider?: string;
    isPending?: boolean;
    email?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  } | null>(null);
  const [dayPassUsage, setDayPassUsage] = useState<{
    totalPasses: number;
    last30DaysPasses: number;
    totalSpent: number;
    shouldSuggestMembership: boolean;
    suggestMembershipReason: string;
    potentialSavings: number;
  } | null>(null);
  const [dayPassForm, setDayPassForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emergencyContact: '',
    emergencyPhone: '',
    paymentMethod: 'CASH' as 'CASH' | 'MOMO',
  });
  const [dayPassErrors, setDayPassErrors] = useState<Record<string, string>>({});

  // Day Pass Upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeUserId, setUpgradeUserId] = useState<string | null>(null);
  const [upgradeUserData, setUpgradeUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact: string;
    emergencyPhone: string;
    address: string;
    dateOfBirth: string;
    needsEmail: boolean;
    needsDateOfBirth: boolean;
  } | null>(null);
  const [upgradePlans, setUpgradePlans] = useState<{
    ONE_MONTH: { price: number; name: string; durationDays: number };
    THREE_MONTHS: { price: number; name: string; durationDays: number };
    ONE_YEAR: { price: number; name: string; durationDays: number };
  } | null>(null);
  const [upgradeFormData, setUpgradeFormData] = useState({
    plan: 'ONE_MONTH' as 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    fitnessGoals: '',
    medicalConditions: '',
    hasHeartCondition: false,
    hasChestPain: false,
    hasDizziness: false,
    hasJointProblems: false,
    takesMedication: false,
    hasOtherConditions: false,
    otherConditionsDetails: '',
    paymentMethod: 'CASH' as 'CASH' | 'MOMO',
    momoReference: '',
  });
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [upgradeErrors, setUpgradeErrors] = useState<Record<string, string>>({});
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [upgradedMemberData, setUpgradedMemberData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    plan: string;
    planName: string;
    reference: string;
    amountPaid: number;
  } | null>(null);

  // Staff modal states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showDeleteStaffModal, setShowDeleteStaffModal] = useState(false);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showEditTrainerModal, setShowEditTrainerModal] = useState(false);
  const [showDeactivateTrainerModal, setShowDeactivateTrainerModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  } | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    specializations: string[];
    certifications?: string[];
    maxWeeklyHours?: number;
    preferredDays?: string[];
    preferredTimes?: string[];
  } | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'RECEPTIONIST' as 'RECEPTIONIST' | 'MANAGER' | 'ADMIN',
    dateOfBirth: '2000-01-01',
  });
  const [trainerFormData, setTrainerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specializations: '',
    certifications: '',
    bio: '',
    maxWeeklyHours: 40,
    preferredDays: '',
    preferredTimes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isSubmittingTrainer, setIsSubmittingTrainer] = useState(false);
  const [trainerError, setTrainerError] = useState<string | null>(null);

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
  const [filteredCheckIns, setFilteredCheckIns] = useState<Array<typeof checkIns[0] & { checkInTime: Date | string }>>([]);

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
  const [editMemberFieldErrors, setEditMemberFieldErrors] = useState<Record<string, string>>({});

  // Ticket generation states
  const [, setIsGeneratingTickets] = useState(false);
  const [, setShowTicketModal] = useState(false);
  const [, setTicketStats] = useState<{
    generated: number;
    total: number;
    needsGeneration: number;
    allGenerated: boolean;
  }>({
    generated: 0,
    total: 0,
    needsGeneration: 0,
    allGenerated: false,
  });

  // Registration form state
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    registrationType: 'WALK_IN' as 'SELF' | 'WALK_IN' | 'ADMIN',
    plan: 'ONE_MONTH',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    fitnessGoals: '',
    medicalConditions: '',
    // PAR-Q fields
    hasHeartCondition: false,
    hasChestPain: false,
    hasDizziness: false,
    hasJointProblems: false,
    takesMedication: false,
    hasOtherConditions: false,
    otherConditionsDetails: '',
    // Payment fields
    paymentMethod: 'CASH' as 'CASH' | 'MOMO',
    amountPaid: String(REG_FEE), // free first month: only registration fee due
    momoReference: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [newMemberErrors, setNewMemberErrors] = useState<Record<string, string>>({});
  const [pendingRegistration, setPendingRegistration] = useState<{
    email: string;
    name: string;
    reference: string;
    expiresAt: string;
    timeRemaining: number;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Expiring / expired members for the Overview card (fetched independently)
  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [isLoadingExpiring, setIsLoadingExpiring] = useState(false);

  const fetchExpiringMembers = useCallback(async () => {
    if (isLoadingExpiring) return;
    setIsLoadingExpiring(true);
    try {
      const res = await fetch('/api/members?status=expiring_or_expired&limit=100&page=1');
      if (!res.ok) throw new Error('Failed to fetch expiring members');
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        // Sort: expiring_soon first (ascending days left), then expired (most recently expired first)
        const sorted = (data.members as Member[]).sort((a, b) => {
          const aDate = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const bDate = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          if (a.status === 'expiring_soon' && b.status !== 'expiring_soon') return -1;
          if (a.status !== 'expiring_soon' && b.status === 'expiring_soon') return 1;
          if (a.status === 'expiring_soon') return aDate - bDate; // soonest first
          return bDate - aDate; // most recently expired first
        });
        setExpiringMembers(sorted);
      }
    } catch (err) {
      console.error('fetchExpiringMembers error:', err);
    } finally {
      setIsLoadingExpiring(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Renewal reminder state (per member)
  const [reminderSending, setReminderSending] = useState<Record<string, boolean>>({});
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({});

  const { push: pushToast } = useToast();

  // Helper function for toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    pushToast(message, type);
  };

  // Send renewal reminder email to a specific member
  const handleSendRenewalReminder = async (memberId: string, memberName: string) => {
    setReminderSending(prev => ({ ...prev, [memberId]: true }));
    try {
      const response = await fetch(`/api/members/${memberId}/send-renewal-reminder`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setReminderSent(prev => ({ ...prev, [memberId]: true }));
        showToast(`Renewal reminder sent to ${memberName}`, 'success');
      } else if (response.status === 429) {
        showToast(data.error || 'A reminder was already sent recently.', 'info');
      } else {
        showToast(data.error || 'Failed to send reminder', 'error');
      }
    } catch {
      showToast('Network error. The reminder was not sent.', 'error');
    } finally {
      setReminderSending(prev => ({ ...prev, [memberId]: false }));
    }
  };

  // Check pending registration status
  const checkPendingStatus = async (email: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/api/members/walk-in/check-status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.status === 'pending') {
        setPendingRegistration(data.pending);
        pushToast(`Payment pending. Time remaining: ${data.pending.timeRemaining} minutes`, 'info');
      } else if (data.status === 'completed') {
        pushToast('Registration completed successfully!', 'success');
        setPendingRegistration(null);
        setNewMemberErrors({});
        setShowNewMemberModal(false);
        fetchMembers(currentPage, pageSize);
      } else if (data.status === 'expired') {
        pushToast('Pending registration expired. You can register again.', 'info');
        setPendingRegistration(null);
        setNewMemberErrors({});
      } else {
        pushToast('No pending registration found', 'info');
        setPendingRegistration(null);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      pushToast('Failed to check payment status', 'error');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Cancel pending registration
  const cancelPendingRegistration = async (email: string) => {
    if (!confirm('Are you sure you want to cancel this pending registration?')) return;

    setIsCancelling(true);
    try {
      const response = await fetch('/api/members/walk-in/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (response.ok) {
        pushToast('Pending registration cancelled. You can register again.', 'success');
        setPendingRegistration(null);
        setNewMemberErrors({});
      } else {
        pushToast(data.error || 'Failed to cancel registration', 'error');
      }
    } catch (error) {
      console.error('Error cancelling:', error);
      pushToast('Failed to cancel registration', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const memberEditSchema = z.object({
    id: z.string().min(1),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    dateOfBirth: z.string().optional(),
    address: z.string().max(200).optional(),
    emergencyContact: z.string().max(100).optional(),
    emergencyPhone: z.string().max(15).optional(),
    fitnessGoals: z.string().max(500).optional(),
    medicalConditions: z.string().max(500).optional(),
  });

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
  const [registeredMemberData, setRegisteredMemberData] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    qrCode?: string;
    plan: string;
    registrationType: string;
    password?: string;
    paymentMethod?: 'CASH' | 'MOMO' | 'CARD';
    amountPaid?: number;
    momoReference?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    parqCompleted?: boolean;
    parqRiskLevel?: string;
  } | null>(null);
  
  // Duplicate check-in warning state
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateCheckInInfo, setDuplicateCheckInInfo] = useState<{
    message: string;
    lastCheckIn: { time: string; method: string; checkedBy: string };
    pendingData: { qrCode?: string; method?: 'qr' | 'manual'; forceCheckIn?: boolean };
  } | null>(null);

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
    category: 'OTHER',
    tags: '',
    status: 'UPCOMING'
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  //  feature modal states
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showClassReviewsModal, setShowClassReviewsModal] = useState(false);
  const [showClassDetailsModal, setShowClassDetailsModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [isFetchingMemberDetails, setIsFetchingMemberDetails] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showMemberClassHistoryModal, setShowMemberClassHistoryModal] = useState(false);
  const [showClassEnrollmentModal, setShowClassEnrollmentModal] = useState(false);
  const [showClassAttendanceModal, setShowClassAttendanceModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showEventAttendeeModal, setShowEventAttendeeModal] = useState(false);
  const [isCancellingClass, setIsCancellingClass] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedAlternativeClasses, setSelectedAlternativeClasses] = useState<string[]>([]);
  const [showEventCancelModal, setShowEventCancelModal] = useState(false);
  const [showEventPromoModal, setShowEventPromoModal] = useState(false);
  const [promoTargetAudience, setPromoTargetAudience] = useState<'all' | 'members' | 'new'>('all');
  const [promoCustomMessage, setPromoCustomMessage] = useState('');
  const [isSendingPromo, setIsSendingPromo] = useState(false);
  const [isCancellingEvent, setIsCancellingEvent] = useState(false);
  const [eventCancellationReason, setEventCancellationReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showEventCheckinModal, setShowEventCheckinModal] = useState(false);
  const [showEventQRScanner, setShowEventQRScanner] = useState(false);
  const [eventCheckinResult, setEventCheckinResult] = useState<{
    success: boolean;
    message: string;
    attendee?: {
      name: string;
      email: string;
      ticketId?: string;
    };
    stats?: {
      totalRegistrations: number;
      checkedIn: number;
      attendanceRate: number;
    };
  } | null>(null);
  const [checkinStats, setCheckinStats] = useState<{
    totalRegistrations: number;
    checkedIn: number;
    notCheckedIn: number;
    attendanceRate: number;
  } | null>(null);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [autoCloseHours, setAutoCloseHours] = useState(2);
  const [selectedClassForModal, setSelectedClassForModal] = useState<typeof classes[0] | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<typeof events[0] | null>(null);

  // Event filters state
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('all');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [eventViewMode, setEventViewMode] = useState<'grid' | 'calendar'>('grid');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    userId: string;
    userName: string;
    userEmail: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
  }>>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditLogFilter, setAuditLogFilter] = useState<string>('all');
  const [auditDateRange, setAuditDateRange] = useState({ start: '', end: '' });
  const [selectedAuditLog, setSelectedAuditLog] = useState<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    userId: string;
    userName: string;
    userEmail: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
  } | null>(null);
  const [showAuditLogDetails, setShowAuditLogDetails] = useState(false);

  // Settings state with validation
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'payment' | 'notifications' | 'security'>('general');
  const [gymSettings, setGymSettings] = useState({
    name: 'GemFitness Tema',
    slogan: 'We Are What We Eat',
    email: 'info@gemfitness.fit',
    phone: '+233 249003832',
    address: 'Gbetsile,Tema, Greater Accra Region, Ghana',
    website: 'www.gemfitness.fit',
    timezone: 'Africa/Accra',
    currency: 'GHS',
    operatingHours: {
      monday: { open: '05:00', close: '22:00', closed: false },
      tuesday: { open: '05:00', close: '22:00', closed: false },
      wednesday: { open: '05:00', close: '22:00', closed: false },
      thursday: { open: '05:00', close: '22:00', closed: false },
      friday: { open: '05:00', close: '22:00', closed: false },
      saturday: { open: '06:00', close: '20:00', closed: false },
      sunday: { open: '07:00', close: '18:00', closed: false },
    },
  });
  const [paymentSettings, setPaymentSettings] = useState({
    paystackPublicKey: '',
    paystackSecretKey: '',
    testMode: true,
    enabledMethods: ['cash', 'momo', 'card'] as string[],
    currency: 'GHS',
    autoRenewal: true,
    gracePeriodDays: 7,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    membershipExpiry: true,
    paymentReminders: true,
    classUpdates: true,
    systemAlerts: true,
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});

  // Fetch payment history
  const fetchPaymentHistory = async (page = 1, method?: string) => {
    setIsLoadingPayments(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('page', page.toString());
      if (method && method !== 'all') {
        // Map UI method names to API values
        const methodMap: Record<string, string> = { momo: 'momo', cash: 'cash', card: 'paystack' };
        params.append('method', methodMap[method] || method);
      }
      const response = await fetch(`/api/payments/history?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.data);
        setPaymentPage(data.pagination?.page || 1);
        setPaymentTotalPages(data.pagination?.pages || 1);
        setPaymentTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoadingAuditLogs(true);
    try {
      const params = new URLSearchParams();
      if (auditLogFilter !== 'all') params.append('action', auditLogFilter);
      if (auditDateRange.start) params.append('startDate', auditDateRange.start);
      if (auditDateRange.end) params.append('endDate', auditDateRange.end);
      params.append('page', '1');
      params.append('limit', '100');

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setAuditLogs(data.data);
      } else if (data.success && Array.isArray(data.logs)) {
        // Backward compatibility with old format
        setAuditLogs(data.logs);
      } else {
        console.error('Invalid audit logs response:', data);
        setAuditLogs([]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  };

  // Export audit logs as CSV
  const handleExportAuditLogs = () => {
    if (auditLogs.length === 0) {
      pushToast('No audit logs to export', 'error');
      return;
    }

    const headers = ['Date', 'Time', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
    const rows = auditLogs.map(log => {
      // Safely parse timestamp
      const timestamp = log.timestamp ? new Date(log.timestamp) : new Date();
      const isValidDate = !isNaN(timestamp.getTime());
      
      return [
        isValidDate ? timestamp.toLocaleDateString('en-GB') : 'N/A',
        isValidDate ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        log.userName || 'System',
        // Safely handle action string replacement
        (log.action && typeof log.action === 'string') ? log.action.replace(/_/g, ' ') : (log.action || 'Unknown'),
        log.entityType || '',
        log.entityId || '',
        log.ipAddress || ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast('Audit logs exported successfully', 'success');
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success) {
        if (data.gymSettings) setGymSettings(data.gymSettings);
        if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
        if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
        if (data.securitySettings) setSecuritySettings(data.securitySettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Validate settings before saving
  const validateSettings = () => {
    const errors: Record<string, string> = {};

    // Validate gym settings
    if (!gymSettings.name.trim()) errors.name = 'Gym name is required';
    if (!gymSettings.email.trim()) errors.email = 'Email is required';
    if (gymSettings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gymSettings.email)) {
      errors.email = 'Invalid email format';
    }
    if (!gymSettings.phone.trim()) errors.phone = 'Phone is required';

    // Validate payment settings
    if (!paymentSettings.testMode && !paymentSettings.paystackSecretKey) {
      errors.paystackSecretKey = 'Secret key required for live mode';
    }
    if (paymentSettings.gracePeriodDays < 0 || paymentSettings.gracePeriodDays > 30) {
      errors.gracePeriodDays = 'Grace period must be between 0-30 days';
    }

    // Validate security settings
    if (securitySettings.sessionTimeout < 5 || securitySettings.sessionTimeout > 120) {
      errors.sessionTimeout = 'Session timeout must be between 5-120 minutes';
    }
    if (securitySettings.maxLoginAttempts < 3 || securitySettings.maxLoginAttempts > 10) {
      errors.maxLoginAttempts = 'Max login attempts must be between 3-10';
    }

    setSettingsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save settings
  const saveSettings = async () => {
    if (!validateSettings()) {
      pushToast('Please fix validation errors before saving', 'error');
      return;
    }

    setIsSavingSettings(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gymSettings,
          paymentSettings,
          notificationSettings,
          securitySettings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        pushToast('Settings saved successfully', 'success');
      } else {
        pushToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      pushToast('Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

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
    fetchMembers(1, 20);
    fetchExpiringMembers();
    fetchCheckIns();
    fetchStats();
    fetchAnalytics();
    fetchPaymentAnalytics();
    fetchPaymentHistory();
    fetchDayPassPrice();
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
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab]);

  // Fetch appropriate data when tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (activeTab === 'checkin' || activeTab === 'members') {
      fetchMembers(currentPage, pageSize);
    }
    
    if (activeTab === 'classes') {
      fetchClasses();
    }
    
    if (activeTab === 'events') {
      fetchEvents();
    }
    
    if (activeTab === 'plans') {
      fetchPlans();
      fetchPlanAnalytics();
      fetchRegistrationFees();
    }
    
    if (activeTab === 'staff') {
      fetchStaff();
      fetchTrainers();
    }

    if (activeTab === 'attendance') {
      fetchAttendanceHistory();
    }

    if (activeTab === 'analytics') {
      fetchAnalytics();
    }

    if (activeTab === 'audit') {
      fetchAuditLogs();
    }

    if (activeTab === 'settings') {
      fetchSettings();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  // Re-fetch audit logs when filter or date range changes
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'audit') return;
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditLogFilter, auditDateRange.start, auditDateRange.end]);

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

  // Fetch plan analytics
  const fetchPlanAnalytics = async () => {
    try {
      const response = await fetch('/api/plans/analytics');
      const data = await response.json();
      if (data.success) {
        setPlanAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching plan analytics:', error);
    }
  };

  // Fetch registration fees
  const fetchRegistrationFees = async () => {
    setIsLoadingFees(true);
    try {
      const response = await fetch('/api/registration-fees');
      const data = await response.json();
      if (data.success) {
        setRegistrationFees(data.fees);
      }
    } catch (error) {
      console.error('Error fetching registration fees:', error);
    } finally {
      setIsLoadingFees(false);
    }
  };

  // Fetch day pass price from API
  const fetchDayPassPrice = async () => {
    try {
      const response = await fetch('/api/day-pass');
      const data = await response.json();
      if (data.success) {
        setDayPassPrice(data.price);
      }
    } catch (error) {
      console.error('Error fetching day pass price:', error);
    }
  };

  // Check if visitor is a returning day pass customer (lookup by phone)
  const checkDayPassVisitor = async (phone: string) => {
    // Only check if phone has enough digits
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setDayPassUsage(null);
      return;
    }

    try {
      const response = await fetch(`/api/day-pass/history?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.success && data.usage) {
        setDayPassUsage(data.usage);
        
        // Auto-fill name if returning visitor
        if (data.user && !dayPassForm.firstName && !dayPassForm.lastName) {
          setDayPassForm(prev => ({
            ...prev,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
          }));
        }
      } else {
        setDayPassUsage(null);
      }
    } catch (error) {
      console.error('Failed to check visitor history:', error);
      setDayPassUsage(null);
    }
  };

  // Handle day pass sale
  const handleSellDayPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingDayPass(true);
    setDayPassErrors({});

    // Validate
    const errors: Record<string, string> = {};
    if (!dayPassForm.firstName.trim() || dayPassForm.firstName.length < 2) errors.firstName = 'First name required';
    if (!dayPassForm.lastName.trim() || dayPassForm.lastName.length < 2) errors.lastName = 'Last name required';
    if (!dayPassForm.phone.trim() || dayPassForm.phone.length < 7) errors.phone = 'Phone number required';
    if (!dayPassForm.emergencyContact.trim() || dayPassForm.emergencyContact.length < 2) errors.emergencyContact = 'Emergency contact required';
    if (!dayPassForm.emergencyPhone.trim() || dayPassForm.emergencyPhone.length < 7) errors.emergencyPhone = 'Emergency phone required';

    if (Object.keys(errors).length > 0) {
      setDayPassErrors(errors);
      setIsProcessingDayPass(false);
      return;
    }

    try {
      const response = await fetch('/api/day-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dayPassForm,
          amountPaid: dayPassPrice,
        }),
      });

      const data = await response.json();
      console.log('📋 Day pass API response:', { status: response.status, data });

      if (response.ok && data.success) {
        // Capture usage data for membership conversion tracking
        if (data.usage) {
          setDayPassUsage(data.usage);

          // Show membership suggestion if applicable
          if (data.usage.shouldSuggestMembership && data.usage.suggestMembershipReason) {
            pushToast(`💡 ${data.usage.suggestMembershipReason}`, 'info');
          }
        }

        // Show late purchase warning if present
        if (data.dayPass?.latePurchaseWarning || data.latePurchaseWarning) {
          pushToast(`⚠️ ${data.dayPass?.latePurchaseWarning || data.latePurchaseWarning}`, 'info');
        }

        // Handle MoMo pending vs Cash immediate success
        if (data.payment_method === 'MOMO' && data.status === 'pending') {
          // MoMo - show pending state in modal, don't close
          setDayPassPending(true);
          setDayPassResult({
            userId: data.userId || data.dayPass?.userId || '',
            firstName: data.dayPass?.firstName || dayPassForm.firstName,
            lastName: data.dayPass?.lastName || dayPassForm.lastName,
            phone: data.dayPass?.phone || dayPassForm.phone,
            price: data.dayPass?.price || dayPassPrice,
            reference: data.reference,
            expiresAt: data.dayPass?.expiresAt || new Date().toISOString(),
            paymentMethod: 'MOMO',
            provider: data.provider,
            isPending: true,
            email: data.dayPass?.email,
            emergencyContact: data.dayPass?.emergencyContact,
            emergencyPhone: data.dayPass?.emergencyPhone,
          });
          pushToast('USSD prompt sent to customer\'s phone', 'info');
        } else {
          // Cash payment - immediate success
          setDayPassSuccess(true);
          setDayPassResult({
            userId: data.userId || data.dayPass.userId,
            firstName: data.dayPass.firstName,
            lastName: data.dayPass.lastName,
            phone: data.dayPass.phone,
            price: data.dayPass.price || dayPassPrice,
            reference: data.reference,
            expiresAt: data.dayPass.expiresAt || new Date().toISOString(),
            transactionId: data.transactionId,
            latePurchaseWarning: data.dayPass.latePurchaseWarning,
            paymentMethod: 'CASH',
            email: data.dayPass.email, // Include email from response
            emergencyContact: data.dayPass.emergencyContact,
            emergencyPhone: data.dayPass.emergencyPhone,
          });
          console.log('✅ Day pass result set:', {
            name: `${data.dayPass.firstName} ${data.dayPass.lastName}`,
            email: data.dayPass.email,
            phone: data.dayPass.phone,
          });
          pushToast(`Day pass sold to ${data.dayPass.firstName} ${data.dayPass.lastName}`, 'success');
          fetchCheckIns();
          fetchStats();
          // Trigger day pass list refresh
          setDayPassRefreshTrigger(prev => prev + 1);
        }
      } else if (response.status === 409) {
        // Duplicate day pass
        console.warn('⚠️ Duplicate day pass attempt:', data);
        if (data.existingPass?.isStillValid) {
          pushToast(`⚠️ ${data.error}\nPass expires at midnight today.`, 'error');
        } else {
          pushToast(data.error || 'Day pass already purchased today', 'error');
        }
      } else if (response.status === 403 && data.limitReached) {
        // Day pass limit reached - strong membership push
        console.warn('⚠️ Day pass limit reached:', data);
        pushToast(data.message || 'Day pass limit reached', 'error');
        if (data.usage) {
          setDayPassUsage(data.usage);
        }
      } else {
        console.error('❌ Day pass API error:', { status: response.status, data });
        pushToast(data.error || data.message || 'Failed to process day pass', 'error');
      }
    } catch (error) {
      console.error('❌ Day pass error:', error);
      pushToast('Failed to process day pass', 'error');
    } finally {
      setIsProcessingDayPass(false);
    }
  };

  // Reset day pass modal
  const closeDayPassModal = () => {
    setShowDayPassModal(false);
    setDayPassSuccess(false);
    setDayPassPending(false);
    setDayPassResult(null);
    setDayPassUsage(null);
    setDayPassErrors({});
    setDayPassForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      emergencyContact: '',
      emergencyPhone: '',
      paymentMethod: 'CASH',
    });
  };

  // Print day pass receipt
  const printDayPassReceipt = async () => {
    if (!dayPassResult) return;

    const receiptWindow = window.open('', '', 'width=300,height=600');
    if (!receiptWindow) {
      pushToast('Please allow pop-ups to print receipt', 'error');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Day Pass Receipt - ${dayPassResult.reference}</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 8mm 4mm; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            max-width: 72mm;
            margin: 0 auto;
            padding: 8mm 4mm;
          }
          .header { text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
          .subheader { text-align: center; font-size: 10px; margin-bottom: 12px; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .label { font-weight: bold; }
          .value { text-align: right; }
          .total { font-size: 13px; font-weight: bold; margin-top: 8px; }
          .footer { text-align: center; font-size: 9px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">GEMFITNESS GYM</div>
        <div class="subheader">DAY PASS RECEIPT</div>
        <div class="divider"></div>
        
        <div class="row">
          <span class="label">Name:</span>
          <span class="value">${dayPassResult.firstName} ${dayPassResult.lastName}</span>
        </div>
        <div class="row">
          <span class="label">Phone:</span>
          <span class="value">${dayPassResult.phone}</span>
        </div>
        <div class="row">
          <span class="label">Reference:</span>
          <span class="value">${dayPassResult.reference}</span>
        </div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div class="row">
          <span class="label">Time:</span>
          <span class="value">${new Date().toLocaleTimeString('en-GB')}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="row total">
          <span class="label">Day Pass:</span>
          <span class="value">GH₵ ${dayPassResult.price}</span>
        </div>
        <div class="row">
          <span class="label">Payment:</span>
          <span class="value">${dayPassForm.paymentMethod}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <div>✓ Checked In</div>
          <div>Valid Until: Today, Midnight</div>
          <div style="margin-top: 8px;">Thank you for visiting!</div>
          <div>www.gemfitness.com</div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.onafterprint = () => window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  // Open upgrade modal and fetch user info
  const openUpgradeModal = async (userId: string) => {
    setIsProcessingUpgrade(true);
    try {
      const response = await fetch(`/api/day-pass/upgrade?userId=${userId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUpgradeUserId(userId);
        setUpgradeUserData({
          ...data.user,
          needsEmail: data.needsEmail,
          needsDateOfBirth: data.needsDateOfBirth,
        });
        setUpgradePlans(data.plans);
        // Pre-fill form with existing user data
        setUpgradeFormData(prev => ({
          ...prev,
          plan: 'ONE_MONTH',
          email: data.user.email || '',
          dateOfBirth: data.user.dateOfBirth || '',
          emergencyContact: data.user.emergencyContact || '',
          emergencyPhone: data.user.emergencyPhone || '',
          address: data.user.address || '',
        }));
        setShowUpgradeModal(true);
        closeDayPassModal(); // Close day pass modal
      } else {
        pushToast(data.error || 'Failed to load upgrade information', 'error');
      }
    } catch (error) {
      console.error('Error loading upgrade info:', error);
      pushToast('Failed to load upgrade information', 'error');
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  // Handle upgrade submission
  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpgradeErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!upgradeFormData.password || upgradeFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (upgradeFormData.password !== upgradeFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!upgradeFormData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (upgradeUserData?.needsEmail && (!upgradeFormData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(upgradeFormData.email))) {
      errors.email = 'Valid email address is required';
    }
    if (!upgradeFormData.emergencyContact || upgradeFormData.emergencyContact.length < 2) {
      errors.emergencyContact = 'Emergency contact name is required';
    }
    if (!upgradeFormData.emergencyPhone || upgradeFormData.emergencyPhone.length < 7) {
      errors.emergencyPhone = 'Emergency contact phone is required';
    }
    if (Object.keys(errors).length > 0) {
      setUpgradeErrors(errors);
      pushToast('Please fix the errors', 'error');
      return;
    }

    if (!upgradeUserId || !upgradePlans) {
      pushToast('Missing upgrade information', 'error');
      return;
    }

    setIsProcessingUpgrade(true);
    try {
      const selectedPlan = upgradePlans[upgradeFormData.plan];
      const amountToPay = selectedPlan.price;

      const response = await fetch('/api/day-pass/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: upgradeUserId,
          plan: upgradeFormData.plan,
          password: upgradeFormData.password,
          dateOfBirth: upgradeFormData.dateOfBirth,
          email: upgradeFormData.email || undefined,
          emergencyContact: upgradeFormData.emergencyContact || undefined,
          emergencyPhone: upgradeFormData.emergencyPhone || undefined,
          address: upgradeFormData.address || undefined,
          fitnessGoals: upgradeFormData.fitnessGoals || undefined,
          medicalConditions: upgradeFormData.medicalConditions || undefined,
          hasHeartCondition: upgradeFormData.hasHeartCondition,
          hasChestPain: upgradeFormData.hasChestPain,
          hasDizziness: upgradeFormData.hasDizziness,
          hasJointProblems: upgradeFormData.hasJointProblems,
          takesMedication: upgradeFormData.takesMedication,
          hasOtherConditions: upgradeFormData.hasOtherConditions,
          otherConditionsDetails: upgradeFormData.otherConditionsDetails || undefined,
          paymentMethod: upgradeFormData.paymentMethod,
          amountPaid: amountToPay,
          momoReference: upgradeFormData.momoReference || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success screen
        setUpgradeSuccess(true);
        setUpgradedMemberData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phone: data.user.phone,
          plan: data.subscription.plan,
          planName: data.subscription.planName,
          reference: data.payment.reference,
          amountPaid: data.payment.amount,
        });
        pushToast(`Successfully upgraded to ${data.subscription.planName}!`, 'success');
        // Refresh data
        fetchMembers();
        setDayPassRefreshTrigger(prev => prev + 1);
        fetchStats();
      } else {
        pushToast(data.error || 'Failed to process upgrade', 'error');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      pushToast('Failed to process upgrade', 'error');
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  // Close upgrade modal
  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeSuccess(false);
    setUpgradeUserId(null);
    setUpgradeUserData(null);
    setUpgradePlans(null);
    setUpgradedMemberData(null);
    setUpgradeErrors({});
    setUpgradeFormData({
      plan: 'ONE_MONTH',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      emergencyContact: '',
      emergencyPhone: '',
      address: '',
      fitnessGoals: '',
      medicalConditions: '',
      hasHeartCondition: false,
      hasChestPain: false,
      hasDizziness: false,
      hasJointProblems: false,
      takesMedication: false,
      hasOtherConditions: false,
      otherConditionsDetails: '',
      paymentMethod: 'CASH',
      momoReference: '',
    });
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

  // Fetch trainers from API
  const fetchTrainers = async () => {
    setIsLoadingTrainers(true);
    try {
      const response = await fetch('/api/staff/trainers');
      const data = await response.json();
      if (data.success) {
        setTrainers(data.trainers);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  // Fetch attendance history (last 30 days or custom range)
  const fetchAttendanceHistory = async (startDate?: string, endDate?: string) => {
    try {
      console.log('📊 Fetching attendance history...');
      
      const params = new URLSearchParams();
      if (startDate || endDate) {
        // Use explicit date range when provided
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      } else {
        // Default: fetch ALL check-in records (no date restriction)
        params.append('all', 'true');
      }

      const response = await fetch(`/api/checkins?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.checkIns)) {
        console.log(`✅ Fetched ${data.checkIns.length} attendance records`);
        setFilteredCheckIns(data.checkIns);
        setAttendancePage(1); // Reset to first page on new data
      } else {
        console.warn('⚠️ Unexpected response from attendance API:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching attendance history:', error);
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
        if (selectedStaff.id === user?.id) {
          await refreshSession();
        }
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

  const parseCommaList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const openEditTrainerModal = (trainer: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    specializations: string[];
    certifications?: string[];
    maxWeeklyHours?: number;
    preferredDays?: string[];
    preferredTimes?: string[];
  }) => {
    setSelectedTrainer(trainer);
    setTrainerFormData({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      specializations: trainer.specializations?.join(', ') || '',
      certifications: trainer.certifications?.join(', ') || '',
      bio: '',
      maxWeeklyHours: trainer.maxWeeklyHours || 40,
      preferredDays: trainer.preferredDays?.join(', ') || '',
      preferredTimes: trainer.preferredTimes?.join(', ') || '',
      status: trainer.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setTrainerError(null);
    setShowEditTrainerModal(true);
  };

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrainer(true);
    setTrainerError(null);

    try {
      const response = await fetch('/api/staff/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trainerFormData.name,
          email: trainerFormData.email || undefined,
          phone: trainerFormData.phone || undefined,
          specializations: parseCommaList(trainerFormData.specializations),
          certifications: parseCommaList(trainerFormData.certifications),
          bio: trainerFormData.bio || undefined,
          maxWeeklyHours: Number(trainerFormData.maxWeeklyHours) || 40,
          preferredDays: parseCommaList(trainerFormData.preferredDays),
          preferredTimes: parseCommaList(trainerFormData.preferredTimes),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddTrainerModal(false);
        setTrainerFormData({
          name: '',
          email: '',
          phone: '',
          specializations: '',
          certifications: '',
          bio: '',
          maxWeeklyHours: 40,
          preferredDays: '',
          preferredTimes: '',
          status: 'ACTIVE',
        });
        fetchTrainers();
        showToast('Trainer added successfully', 'success');
      } else {
        setTrainerError(data.error || 'Failed to add trainer');
      }
    } catch (error) {
      console.error('Error adding trainer:', error);
      setTrainerError('Failed to add trainer');
    } finally {
      setIsSubmittingTrainer(false);
    }
  };

  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;

    setIsSubmittingTrainer(true);
    setTrainerError(null);

    try {
      const response = await fetch(`/api/staff/trainers/${selectedTrainer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trainerFormData.name,
          email: trainerFormData.email || undefined,
          phone: trainerFormData.phone || undefined,
          specializations: parseCommaList(trainerFormData.specializations),
          certifications: parseCommaList(trainerFormData.certifications),
          bio: trainerFormData.bio || undefined,
          maxWeeklyHours: Number(trainerFormData.maxWeeklyHours) || 40,
          preferredDays: parseCommaList(trainerFormData.preferredDays),
          preferredTimes: parseCommaList(trainerFormData.preferredTimes),
          status: trainerFormData.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEditTrainerModal(false);
        setSelectedTrainer(null);
        fetchTrainers();
        showToast('Trainer updated successfully', 'success');
      } else {
        setTrainerError(data.error || 'Failed to update trainer');
      }
    } catch (error) {
      console.error('Error updating trainer:', error);
      setTrainerError('Failed to update trainer');
    } finally {
      setIsSubmittingTrainer(false);
    }
  };

  const handleDeactivateTrainer = async () => {
    if (!selectedTrainer) return;

    setIsSubmittingTrainer(true);
    setTrainerError(null);

    try {
      const response = await fetch(`/api/staff/trainers/${selectedTrainer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeactivateTrainerModal(false);
        setSelectedTrainer(null);
        fetchTrainers();
        showToast('Trainer deactivated successfully', 'success');
      } else {
        setTrainerError(data.error || 'Failed to deactivate trainer');
      }
    } catch (error) {
      console.error('Error deactivating trainer:', error);
      setTrainerError('Failed to deactivate trainer');
    } finally {
      setIsSubmittingTrainer(false);
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    setIsSubmittingMember(true);
    setMemberError(null);

    try {
      const response = await fetch(`/api/members/${selectedMember.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteMemberModal(false);
        setSelectedMember(null);
        fetchMembers(currentPage, pageSize); // Refresh members list
        pushToast('Member deleted', 'success');
      } else {
        setMemberError(data.error || 'Failed to delete member');
        pushToast(data.error || 'Failed to delete member', 'error');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      setMemberError('Failed to delete member');
      pushToast('Failed to delete member', 'error');
    } finally {
      setIsSubmittingMember(false);
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      // Error already logged
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
      // Reset to default (last 30 days)
      fetchAttendanceHistory();
      return;
    }

    // Fetch with custom date range
    const startISO = attendanceStartDate ? new Date(attendanceStartDate).toISOString() : undefined;
    const endISO = attendanceEndDate ? new Date(new Date(attendanceEndDate).setHours(23, 59, 59, 999)).toISOString() : undefined;
    fetchAttendanceHistory(startISO, endISO);
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
    setEditMemberFieldErrors({});

    try {
      // Client-side validation
      const parsed = memberEditSchema.safeParse(editMemberFormData);
      if (!parsed.success) {
        const issues: Record<string, string> = {};
        parsed.error.issues.forEach((iss) => {
          if (iss.path && iss.path[0]) issues[String(iss.path[0])] = iss.message;
        });
        setEditMemberFieldErrors(issues);
        pushToast('Please fix the highlighted fields', 'error');
        setIsUpdatingMember(false);
        return;
      }

      // Use FormData for member update - filter out empty strings for optional fields
      const form = new FormData();
      Object.entries(editMemberFormData).forEach(([k, v]) => {
        // Always include required fields (id, firstName, lastName, email, phone)
        const requiredFields = ['id', 'firstName', 'lastName', 'email', 'phone'];
        
        if (requiredFields.includes(k)) {
          if (v !== undefined && v !== null) form.append(k, String(v));
        } else {
          // For optional fields, only include if not empty
          if (v !== undefined && v !== null && String(v).trim() !== '') {
            form.append(k, String(v));
          }
        }
      });

      const response = await fetch(`/api/members/${editMemberFormData.id}`, {
        method: 'PUT',
        body: form,
      });

      const data = await response.json();
      
      // Log for debugging
      console.log('Update response:', { status: response.status, data });
      
      if (response.status === 400 && data?.details) {
        // Map Zod issues to field errors
        const issues: Record<string, string> = {};
        (data.details || []).forEach((iss: { path?: string[]; message?: string }) => {
          if (iss.path && iss.path[0]) issues[String(iss.path[0])] = iss.message || 'Invalid';
        });
        setEditMemberFieldErrors(issues);
        pushToast('Please fix the highlighted fields', 'error');
        setIsUpdatingMember(false);
        return;
      }

      if (response.status === 409 && data?.fields) {
        const issues: Record<string, string> = {};
        const target = data.fields;
        if (Array.isArray(target)) {
          target.forEach((f: string) => { 
            issues[String(f)] = f === 'email' ? 'Email already exists in system' : 'Already in use'; 
          });
        } else {
          issues[String(target)] = target === 'email' ? 'Email already exists in system' : 'Already in use';
        }
        setEditMemberFieldErrors(issues);
        pushToast(target === 'email' || (Array.isArray(target) && target.includes('email')) 
          ? 'Email address is already registered to another member' 
          : 'Please fix the highlighted fields', 'error');
        setIsUpdatingMember(false);
        return;
      }

      if (data.success) {
        setShowEditMemberModal(false);
        setSelectedMember(null);
        setMemberEditError(null);
        setEditMemberFieldErrors({});
        // Refresh the members list to show updated data
        await fetchMembers(currentPage, pageSize);
        pushToast('Member updated successfully', 'success');
      } else {
        const errorMsg = data.error || data.message || 'Failed to update member';
        setMemberEditError(errorMsg);
        pushToast(errorMsg, 'error');
        console.error('Update failed:', data);
      }
    } catch (error) {
      console.error('Edit member error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An error occurred while updating member';
      setMemberEditError(errorMsg);
      pushToast(errorMsg, 'error');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  // Open edit member modal
  const openEditMemberModal = (member: Member) => {
    setSelectedMember(member);
    
    // Split name if firstName/lastName are not available
    let firstName = member.firstName || '';
    let lastName = member.lastName || '';
    
    if (!firstName && !lastName && member.name) {
      const nameParts = member.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Format date of birth for date input (YYYY-MM-DD)
    let formattedDob = member.dateOfBirth || '';
    if (formattedDob) {
      try {
        const date = new Date(formattedDob);
        if (!isNaN(date.getTime())) {
          formattedDob = date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Failed to format date of birth:', e);
      }
    }
    
    setEditMemberFormData({
      id: member.id,
      firstName,
      lastName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: formattedDob,
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      fitnessGoals: member.fitnessGoals || '',
      medicalConditions: member.medicalConditions || '',
    });
    
    // Clear any previous errors
    setMemberEditError(null);
    setEditMemberFieldErrors({});
    
    setShowEditMemberModal(true);
  };

  // Open the member details modal with fresh API data.
  const openMemberDetailsModal = async (member: Member) => {
    setSelectedMember(member); // Show immediately with existing list data
    setShowMemberDetailsModal(true);
    try {
      setIsFetchingMemberDetails(true);
      const response = await fetch(`/api/members/${member.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.member) {
          setSelectedMember(data.member as Member);
        }
      }
    } catch (err) {
      console.error('Failed to fetch member details:', err);
    } finally {
      setIsFetchingMemberDetails(false);
    }
  };

  // Open delete member modal
  const openDeleteMemberModal = (member: Member) => {
    setSelectedMember(member);
    setMemberError(null);
    setShowDeleteMemberModal(true);
  };

  // Open suspend member modal
  const openSuspendModal = (member: Member) => {
    setMemberToSuspend(member);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  // Handle suspend/unsuspend member
  const handleSuspendMember = async () => {
    if (!memberToSuspend) return;
    if (!suspendReason.trim()) {
      pushToast('Please provide a reason for suspension', 'error');
      return;
    }

    setIsSuspending(true);
    try {
      // Update the member's active subscription to PAUSED
      const response = await fetch(`/api/members/${memberToSuspend.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspendReason: suspendReason.trim(), suspend: true })
      });

      const data = await response.json();
      if (data.success) {
        pushToast(`${memberToSuspend.name} has been suspended`, 'success');
        setShowSuspendModal(false);
        setMemberToSuspend(null);
        setSuspendReason('');
        fetchMembers(currentPage, pageSize);
      } else {
        pushToast(data.error || 'Failed to suspend member', 'error');
      }
    } catch (error) {
      console.error('Error suspending member:', error);
      pushToast('Failed to suspend member', 'error');
    } finally {
      setIsSuspending(false);
    }
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
      role: (staffMember.role || 'RECEPTIONIST').toUpperCase() as 'RECEPTIONIST' | 'MANAGER' | 'ADMIN',
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
    setNewMemberErrors({});
    try {
      // Auto-generate secure password if not provided
      const autoPassword = `GYM${Math.random().toString(36).slice(-8).toUpperCase()}${Math.floor(Math.random() * 100)}`;
      
      // Free first month: only registration fee is collected upfront.
      // The plan price applies at renewal after the 30-day free period.
      const expectedAmount = REG_FEE;
      const actualAmount = parseFloat(newMember.amountPaid || '0');
      
      // Validate amount paid
      if (actualAmount < expectedAmount) {
        setNewMemberErrors({ amountPaid: `Amount should be at least GH₵${expectedAmount} (Registration fee)` });
        pushToast(`Invalid amount. Minimum: GH₵${expectedAmount}`, 'error');
        setIsRegistering(false);
        return;
      }
      
      const memberData = {
        ...newMember,
        password: newMember.password || autoPassword,
        registrationType: 'WALK_IN',
        amountPaid: actualAmount
      };
      
      // Use FormData to support file upload
      const form = new FormData();
      Object.entries(memberData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) form.append(k, String(v));
      });
      
      // Store generated password for receipt
      const generatedPassword = memberData.password;

      const response = await fetch('/api/members/walk-in', {
        method: 'POST',
        body: form,
      });

      // Parse response with proper error handling
      let data;
      try {
        const responseText = await response.text();
        console.log('Raw API response:', { status: response.status, body: responseText });
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        pushToast('Server returned invalid response', 'error');
        return;
      }
      
      // Enhanced logging for debugging
      console.log('Walk-in registration response:', {
        status: response.status,
        ok: response.ok,
        data
      });
      
      if (response.status === 400 && data?.details) {
        const issues: Record<string, string> = {};
        (data.details || []).forEach((iss: { path?: string[]; message?: string }) => {
          if (iss.path && iss.path[0]) issues[String(iss.path[0])] = iss.message || 'Invalid';
        });
        setNewMemberErrors(issues);
        pushToast('Please fix the highlighted fields', 'error');
        return;
      }

      if (response.status === 409 && data?.fields) {
        // Check if this is a "registration in progress" error
        if (data.error === 'Registration already in progress for this email' || data.message?.includes('pending')) {
          // Show pending registration details
          const pendingInfo = {
            email: newMember.email,
            name: `${newMember.firstName} ${newMember.lastName}`,
            reference: data.reference || 'Unknown',
            expiresAt: data.expiresAt || '',
            timeRemaining: 0
          };
          setPendingRegistration(pendingInfo);
          pushToast(data.message || 'A mobile money payment is pending for this email', 'info');
          return;
        }

        // Handle duplicate email/phone errors
        const issues: Record<string, string> = {};
        const target = data.fields;
        if (Array.isArray(target)) {
          target.forEach((f: string) => { 
            issues[String(f)] = f === 'email' ? 'Email already exists in system' : 'Already in use'; 
          });
        } else {
          issues[String(target)] = target === 'email' ? 'Email already exists in system' : 'Already in use';
        }
        setNewMemberErrors(issues);
        pushToast(target === 'email' || (Array.isArray(target) && target.includes('email')) 
          ? 'Email address is already registered to another member' 
          : 'Please fix the highlighted fields', 'error');
        return;
      }

      if (response.ok || data.success) {
        // Check if payment is pending (MoMo)
        if (data.payment_method === 'MOMO' && data.status === 'pending') {
          // MoMo payment pending - show pending state
          pushToast('USSD prompt sent to customer phone. Awaiting payment...', 'info');
          setNewMemberErrors({});
          // Reset form but keep modal open to show pending state
          // We'll handle this in the UI if needed
        } else {
          // CASH or completed payment - store data for receipt
          setRegisteredMemberData({
            ...data.user,
            plan: memberData.plan,
            registrationType: memberData.registrationType,
            password: data.password || generatedPassword,
            paymentMethod: memberData.paymentMethod,
            amountPaid: memberData.amountPaid,
            momoReference: data.reference || memberData.momoReference,
            emergencyContact: memberData.emergencyContact,
            emergencyPhone: memberData.emergencyPhone,
          });
          setRegistrationSuccess(true);
          // Refresh members list
          fetchMembers(currentPage, pageSize);
          fetchAnalytics();
          pushToast('Member registered successfully', 'success');
        }
      } else {
        // Show detailed error message
        const errorMsg = data.error || data.message || 'Failed to register member';
        console.error('Registration failed:', { status: response.status, data });
        pushToast(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to register member';
      pushToast(errorMsg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle print receipt and close registration modal
  const handlePrintReceipt = async () => {
    if (!registeredMemberData) return;

    const planDetails = {
      'DAILY':        { name: 'Day Pass',      price: dayPassPrice,                   duration: '1 Day'   },
      'ONE_MONTH':    { name: 'Monthly',        price: PLAN_PRICING.ONE_MONTH.price,   duration: '1 Month' },
      'THREE_MONTHS': { name: 'Quarterly',      price: PLAN_PRICING.THREE_MONTHS.price, duration: '3 Months' },
      'SIX_MONTHS':   { name: 'Semi-Annual',    price: 1000,                           duration: '6 Months' },
      'ONE_YEAR':     { name: 'Annual',         price: PLAN_PRICING.ONE_YEAR.price,    duration: '1 Year'  },
      'TWELVE_MONTHS':{ name: 'Annual',         price: PLAN_PRICING.ONE_YEAR.price,    duration: '1 Year'  },
    };

    const regFees = {
      'SINGLE': 250,
      'COUPLE': 400,
      'FAMILY': 1000,
    };

    const plan = planDetails[registeredMemberData.plan as keyof typeof planDetails]
      ?? { name: registeredMemberData.plan?.replace(/_/g, ' ') ?? 'Membership', price: registeredMemberData.amountPaid ?? 0, duration: 'N/A' };
    const regFee = regFees[registeredMemberData.registrationType as keyof typeof regFees] || 250;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await printRegistrationReceipt({
      receiptNumber: generateReceiptNumber(),
      memberName: `${registeredMemberData.firstName} ${registeredMemberData.lastName}`,
      memberId: registeredMemberData.id,
      email: registeredMemberData.email,
      phone: registeredMemberData.phone,
      password: registeredMemberData.password || 'AUTO-GENERATED', // Auto-generated password
      registrationType: registeredMemberData.registrationType as 'SINGLE' | 'COUPLE' | 'FAMILY',
      registrationFee: regFee,
      membershipPlan: plan.name,
      planPrice: plan.price,
      planDuration: plan.duration,
      firstPaymentDate: nextMonth.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paymentMethod: registeredMemberData.paymentMethod || 'CASH',
      ...(registeredMemberData.amountPaid !== undefined && { amountPaid: registeredMemberData.amountPaid }),
      momoReference: registeredMemberData.momoReference || 'N/A',
      qrCode: registeredMemberData.qrCode || 'N/A',
      receivedBy: user?.email || 'Receptionist',
      ...(registeredMemberData.emergencyContact && { emergencyContact: registeredMemberData.emergencyContact }),
      ...(registeredMemberData.emergencyPhone && { emergencyPhone: registeredMemberData.emergencyPhone }),
      ...(registeredMemberData.parqCompleted !== undefined && { parqCompleted: registeredMemberData.parqCompleted }),
      ...(registeredMemberData.parqRiskLevel && { parqRiskLevel: registeredMemberData.parqRiskLevel }),
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
      registrationType: 'WALK_IN',
      plan: 'ONE_MONTH',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      fitnessGoals: '',
      medicalConditions: '',
      hasHeartCondition: false,
      hasChestPain: false,
      hasDizziness: false,
      hasJointProblems: false,
      takesMedication: false,
      hasOtherConditions: false,
      otherConditionsDetails: '',
      paymentMethod: 'CASH',
      amountPaid: String(REG_FEE),
      momoReference: '',
    });
  };

  // Open class modal for creating or editing
  const openClassModal = (classData?: typeof classes[0]) => {
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
        pushToast(editingClass ? 'Class updated successfully!' : 'Class created successfully!', 'success');
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
        pushToast('Class deleted successfully!', 'success');
      } else {
        pushToast('Failed to delete class', 'error');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      pushToast('Error deleting class', 'error');
    }
  };

  // Cancel class with notifications
  const handleCancelClass = async () => {
    if (!selectedClassForModal || !cancellationReason.trim()) {
      pushToast('Please provide a cancellation reason', 'error');
      return;
    }

    setIsCancellingClass(true);
    try {
      const response = await fetch(`/api/classes/${selectedClassForModal.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancellationReason,
          alternativeClassIds: selectedAlternativeClasses,
          notifyMembers: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchClasses();
        setShowCancellationModal(false);
        setSelectedClassForModal(null);
        setCancellationReason('');
        setSelectedAlternativeClasses([]);
        showToast(`Class cancelled successfully! ${data.notifications?.sent || 0} members notified.`, 'success');
      } else {
        showToast(data.error || 'Failed to cancel class', 'error');
      }
    } catch (error) {
      console.error('Error cancelling class:', error);
      showToast('Error cancelling class', 'error');
    } finally {
      setIsCancellingClass(false);
    }
  };

  // Handle Event Cancellation with Refunds
  const handleCancelEvent = async () => {
    if (!selectedEventForModal || !eventCancellationReason.trim()) {
      showToast('Please provide a cancellation reason', 'error');
      return;
    }

    setIsCancellingEvent(true);
    try {
      const response = await fetch(`/api/events/${selectedEventForModal.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: eventCancellationReason,
          sendNotifications: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchEvents();
        setShowEventCancelModal(false);
        setSelectedEventForModal(null);
        setEventCancellationReason('');
        
        let message = `Event cancelled successfully!`;
        if (data.notifications?.sent) {
          message += ` ${data.notifications.sent} attendees notified.`;
        }
        if (data.refunds?.processed) {
          message += ` ${data.refunds.processed} refunds processed (GH₵ ${data.refunds.totalAmount}).`;
        }
        showToast(message, 'success');
      } else {
        showToast(data.error || 'Failed to cancel event', 'error');
      }
    } catch (error) {
      console.error('Error cancelling event:', error);
      showToast('Error cancelling event', 'error');
    } finally {
      setIsCancellingEvent(false);
    }
  };

  // Handle Send Event Promotional Email
  const handleSendEventPromo = async () => {
    if (!selectedEventForModal) return;

    setIsSendingPromo(true);
    try {
      const response = await fetch(`/api/events/${selectedEventForModal.id}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetAudience: promoTargetAudience,
          customMessage: promoCustomMessage || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowEventPromoModal(false);
        setPromoCustomMessage('');
        showToast(`Promotional emails sent to ${data.stats.recipientCount} recipients!`, 'success');
      } else {
        showToast(data.error || 'Failed to send promotional emails', 'error');
      }
    } catch (error) {
      console.error('Error sending promotional emails:', error);
      showToast('Error sending promotional emails', 'error');
    } finally {
      setIsSendingPromo(false);
    }
  };

  // Generate QR tickets for event
  const handleGenerateTickets = async (eventId: string) => {
    setIsGeneratingTickets(true);
    try {
      const response = await fetch(`/api/events/${eventId}/generate-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setTicketStats({
          generated: data.generatedCount,
          total: data.totalRegistrations,
          needsGeneration: 0,
          allGenerated: true
        });
        setShowTicketModal(true);
        pushToast(`Generated ${data.generatedCount} QR tickets successfully!`, 'success');
      } else {
        pushToast(data.error || 'Failed to generate tickets', 'error');
      }
    } catch (error) {
      console.error('Error generating tickets:', error);
      pushToast('Error generating tickets', 'error');
    } finally {
      setIsGeneratingTickets(false);
    }
  };

  // Fetch event check-in stats
  const fetchEventCheckinStats = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/stats`);
      const data = await response.json();
      if (data.success) {
        setCheckinStats({
          totalRegistrations: data.stats.totalRegistrations,
          checkedIn: data.stats.checkedIn,
          notCheckedIn: data.stats.notCheckedIn,
          attendanceRate: data.stats.attendanceRate,
        });
      }
    } catch (error) {
      console.error('Error fetching check-in stats:', error);
    }
  };

  // Handle event QR scan for check-in
  const handleEventQRScan = async (qrData: string) => {
    if (!selectedEventForModal) return;

    setShowEventQRScanner(false);

    try {
      const response = await fetch(`/api/events/${selectedEventForModal.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      const data = await response.json();

      if (data.success) {
        setEventCheckinResult({
          success: true,
          message: 'Check-in successful!',
          attendee: data.attendee,
          stats: data.stats
        });

        // Update stats
        if (data.stats) {
          setCheckinStats({
            totalRegistrations: data.stats.totalRegistrations,
            checkedIn: data.stats.checkedIn,
            notCheckedIn: data.stats.notCheckedIn,
            attendanceRate: data.stats.attendanceRate,
          });
        }

        // Auto-close success message after 3 seconds
        setTimeout(() => {
          setEventCheckinResult(null);
        }, 3000);
      } else {
        setEventCheckinResult({
          success: false,
          message: data.error || 'Check-in failed',
          attendee: data.attendee
        });
      }
    } catch (error) {
      console.error('Error during event check-in:', error);
      setEventCheckinResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    }
  };

  // Open event check-in modal
  const openEventCheckinModal = (event: typeof events[0]) => {
    setSelectedEventForModal(event);
    setShowEventCheckinModal(true);
    setEventCheckinResult(null);
    fetchEventCheckinStats(event.id);
  };

  // Set registration deadline
  const handleSetDeadline = async () => {
    if (!selectedEventForModal || !deadlineDate) {
      pushToast('Please select a deadline date', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/events/${selectedEventForModal.id}/deadline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationDeadline: deadlineDate,
          autoCloseHours,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchEvents();
        setShowDeadlineModal(false);
        setSelectedEventForModal(null);
        setDeadlineDate('');
        pushToast('Registration deadline set successfully!', 'success');
      } else {
        pushToast(data.error || 'Failed to set deadline', 'error');
      }
    } catch (error) {
      console.error('Error setting deadline:', error);
      pushToast('Error setting deadline', 'error');
    }
  };

  // Open event modal for creating or editing
  const openEventModal = (eventData?: typeof events[0]) => {
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
        category: eventData.category || 'OTHER',
        tags: eventData.tags?.join(', ') || '',
        status: eventData.status
      });
      // Set preview for existing image
      setEventImagePreview(eventData.image || null);
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
        category: 'OTHER',
        tags: '',
        status: 'UPCOMING'
      });
      // Clear preview for new event
      setEventImagePreview(null);
    }
    setEventError(null);
    setShowEventModal(true);
  };

  // Close event modal
  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventError(null);
    setEventImagePreview(null);
    setIsUploadingImage(false);
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
      category: 'OTHER',
      tags: '',
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
        pushToast(editingEvent ? 'Event updated successfully!' : 'Event created successfully!', 'success');
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
        pushToast('Event deleted successfully!', 'success');
      } else {
        pushToast(data.error || 'Failed to delete event', 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      pushToast('Error deleting event', 'error');
    }
  };

  // Handle event image upload
  const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      pushToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      pushToast('Image size must be less than 5MB', 'error');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEventImagePreview(base64String);
        setEventFormData({ ...eventFormData, image: base64String });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      pushToast('Failed to upload image', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove event image
  const handleRemoveEventImage = () => {
    setEventImagePreview(null);
    setEventFormData({ ...eventFormData, image: '' });
  };

  // Handle check-in
  const handleCheckIn = async (overrideData?: { qrCode?: string; method?: 'qr' | 'manual'; forceCheckIn?: boolean }) => {
    const dataToSend = overrideData || checkInData;

    // Validate QR code
    if (!dataToSend.qrCode) {
      pushToast('No QR code found for this member', 'error');
      return;
    }

    // Normalize QR code format - accept both GYM|<token> and raw <token>
    const fullQrPattern = /^GYM\|[A-Za-z0-9_-]{24}$/;
    const tokenPattern = /^[A-Za-z0-9_-]{24}$/;
    
    let normalizedQrCode: string;
    if (fullQrPattern.test(dataToSend.qrCode)) {
      normalizedQrCode = dataToSend.qrCode;
    } else if (tokenPattern.test(dataToSend.qrCode)) {
      normalizedQrCode = `GYM|${dataToSend.qrCode}`;
    } else {
      pushToast('Invalid QR code format', 'error');
      return;
    }

    try {
      // First, check if member has completed PAR-Q
      const memberCheck = await fetch(`/api/members/check-parq?qrCode=${encodeURIComponent(normalizedQrCode)}`);
      const memberData = await memberCheck.json();
      
      if (memberData.requiresParQ) {
        // Show PAR-Q warning and prompt
        const shouldContinue = confirm(
          `⚠️ PAR-Q Health Screening Required\n\n` +
          `Member: ${memberData.memberName}\n` +
          `This member has not completed their health screening (PAR-Q).\n\n` +
          `Options:\n` +
          `• Complete PAR-Q now (recommended)\n` +
          `• Allow check-in anyway (proceed)\n\n` +
          `Press OK to proceed with check-in, or Cancel to complete PAR-Q first.`
        );
        
        if (!shouldContinue) {
          // Offer to open PAR-Q form
          const openForm = confirm(
            `Would you like to have the member complete their health screening now?\n\n` +
            `This will open the PAR-Q form on this device.`
          );
          
          if (openForm) {
            window.open(`/member/par-q?memberId=${memberData.memberId}`, '_blank');
          }
          return;
        }
        // If they chose to continue, add a note about PAR-Q requirement
        console.warn('⚠️ Check-in allowed without PAR-Q completion for member:', memberData.memberId);
      }

      const result = await performCheckIn({
        qrCode: normalizedQrCode,
        method: dataToSend.method || 'qr',
        checkedBy: user ? `${user.firstName} ${user.lastName}` : 'system',
        forceCheckIn: ('forceCheckIn' in dataToSend) ? dataToSend.forceCheckIn || false : false
      });

      if (result.success) {
        pushToast(`Check-in successful! ${result.checkIn?.member} checked in at ${new Date().toLocaleTimeString()}`);
        setShowCheckInModal(false);
        setShowDuplicateWarning(false);
        setDuplicateCheckInInfo(null);
        setCheckInData({ qrCode: '', memberId: '', method: 'qr' });
        
        // Refresh check-ins and analytics
        await fetchCheckIns();
        await fetchAnalytics();
      } else if (result.duplicate && result.lastCheckIn) {
        // Show duplicate warning modal
        setDuplicateCheckInInfo({
          message: result.message || 'Member already checked in recently',
          lastCheckIn: result.lastCheckIn,
          pendingData: {
            qrCode: normalizedQrCode,
            method: dataToSend.method || 'qr',
            forceCheckIn: false
          }
        });
        setShowDuplicateWarning(true);
      } else {
        pushToast(result.error || 'Failed to check-in', 'error');
      }
    } catch (error) {
      console.error('❌ Check-in error:', error);
      pushToast('Failed to check-in. Please check your connection and try again.', 'error');
    }
  };

  // Handle force check-in (override duplicate warning)
  const handleForceCheckIn = async () => {
    if (!duplicateCheckInInfo) return;

    await handleCheckIn({
      ...duplicateCheckInInfo.pendingData,
      forceCheckIn: true
    });
  };

  // Permission checks
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const canViewReports = isManager;
  const canManagePayments = isManager;
  const canViewFinancials = isManager;
  const canManagePlans = isManager;
  const canManageStaff = isManager;
  const canSuspendMembers = isManager;
  const canManageClasses = isManager; // Managers and Admins can add/edit/delete classes
  
  // Receptionist permissions (both roles can do these)
  const canRegisterMember = true;
  const canUpdateBasicInfo = true;
  const canCreateEvents = true; // Both managers and receptionists can create events

  // Use server-side search/pagination. Keep client-side search as fallback but prefer server results.
  const filteredMembers = members;

  // Debounced server-side search + filters
  useEffect(() => {
    const t = setTimeout(() => {
      const statusParam = memberStatusFilter === 'all' ? undefined : memberStatusFilter;
      const planParam = planFilter === 'all' ? undefined : planFilter;
      fetchMembers(1, pageSize, searchQuery || undefined, statusParam, planParam);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, memberStatusFilter, planFilter]);

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
          adminRole={user?.role || 'RECEPTIONIST'}
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
                  {activeTab === 'daypass' && 'Day pass sales and management'}
                  {activeTab === 'payments' && 'Payment tracking and revenue'}
                  {activeTab === 'receipts' && 'Member payment receipts and downloads'}
                  {activeTab === 'plans' && 'Membership plan management'}
                  {activeTab === 'staff' && 'Staff account management'}
                  {activeTab === 'reports' && 'Comprehensive reports and data exports'}
                  {activeTab === 'analytics' && 'Business analytics and reports'}
                  {activeTab === 'parq' && 'PAR-Q health screening and safety advice'}
                  {activeTab === 'audit' && 'Security and activity audit logs'}
                  {activeTab === 'settings' && 'System configuration and preferences'}
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
                { label: 'Total Members', value: (totalMembers || 0).toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', visible: true },
                { label: 'Active Members', value: (analytics?.activeMembers || members.filter(m => m.status === 'active').length || 0).toLocaleString(), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', visible: true },
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

              {/* ── Membership Alerts ─────────────────────────────────────── */}
              <Card className="border-2 border-gray-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Membership Alerts</CardTitle>
                        <CardDescription>
                          {isLoadingExpiring ? 'Loading…' :
                            expiringMembers.length === 0
                              ? 'All memberships are healthy'
                              : (() => {
                                  const expiring = expiringMembers.filter(m => m.status === 'expiring_soon').length;
                                  const expired  = expiringMembers.filter(m => m.status === 'expired').length;
                                  const parts = [];
                                  if (expiring) parts.push(`${expiring} expiring within 7 days`);
                                  if (expired)  parts.push(`${expired} recently expired`);
                                  return parts.join(' · ');
                                })()
                          }
                        </CardDescription>
                      </div>
                    </div>
                    <button
                      onClick={fetchExpiringMembers}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      title="Refresh"
                    >
                      {isLoadingExpiring
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <History className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoadingExpiring ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : expiringMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-10 w-10 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">All active memberships valid for 7+ days</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {expiringMembers.slice(0, 6).map((member) => {
                          const expDate   = member.expiresAt ? new Date(member.expiresAt) : null;
                          const diffMs    = expDate ? expDate.getTime() - Date.now() : 0;
                          const daysUntil = expDate ? Math.ceil(diffMs / 86400000) : 0;
                          const isExpired = member.status === 'expired';
                          const isSending = reminderSending[member.id];
                          const isSent    = reminderSent[member.id];

                          // Left-border colour for status (keeps rows clean white)
                          const borderColor = isExpired
                            ? 'border-l-red-400'
                            : daysUntil <= 1
                            ? 'border-l-orange-400'
                            : daysUntil <= 3
                            ? 'border-l-amber-400'
                            : 'border-l-yellow-300';

                          const badgeStyle = isExpired
                            ? 'bg-red-50 text-red-600'
                            : daysUntil <= 1
                            ? 'bg-orange-50 text-orange-600'
                            : daysUntil <= 3
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-yellow-50 text-yellow-700';

                          const badgeText = isExpired
                            ? `Expired ${Math.abs(daysUntil)}d ago`
                            : daysUntil === 0
                            ? 'Expires today'
                            : `${daysUntil}d left`;

                          return (
                            <div
                              key={member.id}
                              className={`flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg border-l-4 ${borderColor}`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </p>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="h-3 w-3 flex-shrink-0" />
                                    {member.phone || 'Not provided'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {member.plan?.replace(/_/g, ' ') || 'N/A'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {isExpired ? 'Expired' : 'Expires'} {member.expiresAt}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSending || isSent}
                                onClick={() => handleSendRenewalReminder(member.id, member.name)}
                                className={`flex-shrink-0 flex items-center gap-1.5 h-8 text-xs ${
                                  isSent
                                    ? 'border-green-400 text-green-600 bg-green-50'
                                    : 'border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-600'
                                }`}
                              >
                                {isSending
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : isSent
                                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                                  : <Send className="h-3.5 w-3.5" />
                                }
                                {isSent ? 'Sent' : 'Contact'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      {expiringMembers.length > 6 && (
                        <Button
                          variant="outline"
                          className="w-full mt-3 border-2"
                          onClick={() => setActiveTab('members')}
                        >
                          View All {expiringMembers.length} Members
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ── Today's Check-Ins ───────────────────────────────────────── */}
              <Card className="border-2 border-gray-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Today&apos;s Check-Ins</CardTitle>
                      <CardDescription>{analytics?.todayCheckIns || 0} check-ins today</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {checkIns.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {checkIns.slice(0, 6).map((checkin) => (
                          <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-l-green-300">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                checkin.method === 'qr' ? 'bg-green-100' : 'bg-blue-100'
                              }`}>
                                {checkin.method === 'qr'
                                  ? <QrCode className="h-4 w-4 text-green-600" />
                                  : <UserCheck className="h-4 w-4 text-blue-600" />
                                }
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{checkin.member}</p>
                                <p className="text-xs text-gray-500">{checkin.time} · {checkin.method === 'qr' ? 'QR Scan' : 'Manual'}</p>
                              </div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                      <Button onClick={() => setActiveTab('attendance')} variant="outline" className="w-full mt-3 border-2">
                        View All Check-Ins
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
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
                              <p className="text-xs text-gray-500">{member.phone} • {member.plan?.replace(/_/g, ' ')}</p>
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

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Trainer Management</CardTitle>
                    <CardDescription>Manage trainers, preferences, and availability</CardDescription>
                  </div>
                  {isManager && (
                    <Button 
                      onClick={() => {
                        setTrainerFormData({
                          name: '',
                          email: '',
                          phone: '',
                          specializations: '',
                          certifications: '',
                          bio: '',
                          maxWeeklyHours: 40,
                          preferredDays: '',
                          preferredTimes: '',
                          status: 'ACTIVE',
                        });
                        setTrainerError(null);
                        setShowAddTrainerModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                    >
                      <Dumbbell className="mr-2 h-5 w-5" />
                      Add Trainer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTrainers ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading trainers...</p>
                  </div>
                ) : trainers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No trainers found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Specializations</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {trainers.map((trainer) => (
                          <tr key={trainer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{trainer.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{trainer.email || 'Not provided'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{trainer.phone || 'Not provided'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {trainer.specializations?.length ? trainer.specializations.join(', ') : 'Not provided'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                trainer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {trainer.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {isManager && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Edit trainer"
                                    onClick={() => openEditTrainerModal(trainer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700" 
                                    title="Deactivate trainer"
                                    onClick={() => {
                                      setSelectedTrainer(trainer);
                                      setTrainerError(null);
                                      setShowDeactivateTrainerModal(true);
                                    }}
                                  >
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
                  <select
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value as 'all' | 'active' | 'expiring_soon' | 'expired')}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                  <select
                    className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                  >
                    <option value="all">All Plans</option>
                    <option value="ONE_MONTH">1 Month</option>
                    <option value="THREE_MONTHS">3 Months</option>
                    <option value="SIX_MONTHS">6 Months</option>
                    <option value="ONE_YEAR">12 Months</option>
                    <option value="DAILY">Daily Walk-In</option>
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
                                onClick={() => openMemberDetailsModal(member as Member)}
                                title="View member details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member as Member);
                                  setShowMemberClassHistoryModal(true);
                                }}
                                title="View class history"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              {canUpdateBasicInfo && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditMemberModal(member as Member)}
                                  title="Edit member"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canSuspendMembers && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openSuspendModal(member as Member)}
                                  title="Suspend member"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => openDeleteMemberModal(member as Member)}
                                  title="Delete member"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                  <p className="text-sm text-gray-600">Showing {members.length} of {totalMembers} members</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        if (currentPage > 1) fetchMembers(currentPage - 1, pageSize);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage * pageSize >= totalMembers}
                      onClick={() => {
                        if (currentPage * pageSize < totalMembers) fetchMembers(currentPage + 1, pageSize);
                      }}
                    >
                      Next
                    </Button>
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
            {/* Class Analytics Cards */}
            <ClassAnalyticsCards />

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

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.round((classItem.enrolled / classItem.maxCapacity) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick metrics - Dynamic data */}
                        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                          {classItem.rating && (
                            <div className="flex items-center gap-1 text-gray-600 bg-yellow-50 p-2 rounded">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{classItem.rating.toFixed(1)}</span>
                              {classItem.totalReviews && (
                                <span className="text-gray-400">({classItem.totalReviews})</span>
                              )}
                            </div>
                          )}
                          {classItem.waitlistCount !== undefined && classItem.waitlistCount > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 bg-blue-50 p-2 rounded">
                              <Users className="h-3 w-3 text-blue-500" />
                              <span className="font-medium">Wait: {classItem.waitlistCount}</span>
                            </div>
                          )}
                        </div>

                        {canManageClasses && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1 border-2"
                              onClick={() => {
                                setSelectedClassForModal(classItem);
                                setShowClassDetailsModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Quick View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2">
                                  Manage <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClassForModal(classItem);
                                    setShowClassEnrollmentModal(true);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Manage Enrollments
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClassForModal(classItem);
                                    setShowClassAttendanceModal(true);
                                  }}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-2" />
                                  View Attendance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClassForModal(classItem);
                                    setShowWaitlistModal(true);
                                  }}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Manage Waitlist
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedClassForModal(classItem);
                                    setShowClassReviewsModal(true);
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  View Reviews
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openClassModal(classItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Class
                                </DropdownMenuItem>
                                {classItem.status === 'ACTIVE' && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClassForModal(classItem);
                                      setShowCancellationModal(true);
                                    }}
                                    className="text-orange-600 focus:text-orange-600"
                                  >
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Cancel Class
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClass(classItem.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
            {/* Event Analytics Cards */}
            <EventAnalyticsCards />

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
                {/* Filters, Search, and View Toggle */}
                <div className="flex flex-col gap-3 mb-6">
                  {/* Top Row: Search and View Toggle */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={eventSearchQuery}
                        onChange={(e) => setEventSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 border-2 border-gray-200 rounded-lg p-1">
                      <button
                        onClick={() => setEventViewMode('grid')}
                        className={`flex items-center gap-2 px-3 py-1 rounded ${
                          eventViewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        onClick={() => setEventViewMode('calendar')}
                        className={`flex items-center gap-2 px-3 py-1 rounded ${
                          eventViewMode === 'calendar' ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <CalendarDays className="h-4 w-4" />
                        <span className="hidden sm:inline">Calendar</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                      value={eventStatusFilter}
                      onChange={(e) => setEventStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                      className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                      value={eventCategoryFilter}
                      onChange={(e) => setEventCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="COMPETITION">Competition</option>
                      <option value="SOCIAL">Social</option>
                      <option value="TRAINING">Training</option>
                      <option value="WELLNESS">Wellness</option>
                      <option value="CHARITY">Charity</option>
                      <option value="CELEBRATION">Celebration</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {isLoadingEvents ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No events found. Create your first event!</p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const filteredEvents = events.filter(event => {
                        const matchesSearch = eventSearchQuery === '' || 
                          event.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(eventSearchQuery.toLowerCase());
                        
                        const matchesStatus = eventStatusFilter === 'all' || 
                          event.status?.toLowerCase() === eventStatusFilter;
                        
                        const matchesCategory = eventCategoryFilter === 'all' ||
                          event.category === eventCategoryFilter || !event.category;
                        
                        return matchesSearch && matchesStatus && matchesCategory;
                      });

                      if (filteredEvents.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
                            <p className="text-gray-600 mb-4">
                              {eventSearchQuery || eventStatusFilter !== 'all' || eventCategoryFilter !== 'all'
                                ? 'Try adjusting your filters or search query'
                                : 'Create your first event to get started'
                              }
                            </p>
                            {eventSearchQuery || eventStatusFilter !== 'all' || eventCategoryFilter !== 'all' ? (
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setEventSearchQuery('');
                                  setEventStatusFilter('all');
                                  setEventCategoryFilter('all');
                                }}
                              >
                                Clear Filters
                              </Button>
                            ) : canCreateEvents && (
                              <Button 
                                onClick={() => openEventModal()}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Event
                              </Button>
                            )}
                          </div>
                        );
                      }

                      // Calendar View
                      if (eventViewMode === 'calendar') {
                        return (
                          <EventCalendarView
                            events={filteredEvents}
                            onEventClick={(event) => {
                              setSelectedEventForModal(event as typeof events[0]);
                              setShowEventDetailsModal(true);
                            }}
                          />
                        );
                      }

                      // Grid View
                      return (
                        <div className="space-y-3">
                          {filteredEvents.map((event) => (
                            <Card key={event.id} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                  {/* Small Event Image */}
                                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                    {event.image ? (
                                      <Image 
                                        src={event.image} 
                                        alt={event.title} 
                                        width={80}
                                        height={80}
                                        className="object-cover rounded-lg"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-orange-400">
                                        <ImageIcon className="h-8 w-8" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Event Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h3 className="text-lg font-bold text-gray-900 truncate">{event.title}</h3>
                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                        event.status?.toUpperCase() === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                        event.status?.toUpperCase() === 'ONGOING' ? 'bg-green-100 text-green-700' :
                                        event.status?.toUpperCase() === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {event.status?.toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-orange-500" />
                                        {event.eventDate}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-orange-500" />
                                        {event.location}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-orange-500" />
                                        {event.registered}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Ticket className="h-3 w-3 text-orange-500" />
                                        {event.isFree ? 'Free' : `GH₵ ${event.price}`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Prominent Action Buttons */}
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedEventForModal(event);
                                        setShowEventPromoModal(true);
                                      }}
                                      className="bg-purple-500 hover:bg-purple-600"
                                    >
                                      <Mail className="h-4 w-4 mr-1" />
                                      Promote
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-36">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedEventForModal(event);
                                            setShowEventDetailsModal(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedEventForModal(event);
                                            setShowEventAttendeeModal(true);
                                          }}
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          Manage Attendees
                                        </DropdownMenuItem>
                                        {!event.isFree && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedEventForModal(event);
                                              handleGenerateTickets(event.id);
                                            }}
                                          >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Generate Tickets
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => openEventCheckinModal(event)}
                                        >
                                          <ClipboardCheck className="h-4 w-4 mr-2" />
                                          Event Check-in
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedEventForModal(event);
                                            setShowDeadlineModal(true);
                                          }}
                                        >
                                          <Clock className="h-4 w-4 mr-2" />
                                          Set Deadline
                                        </DropdownMenuItem>
                                        {canCreateEvents && (
                                          <>
                                            <DropdownMenuItem onClick={() => openEventModal(event)}>
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit Event
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedEventForModal(event);
                                                setShowBulkEmailModal(true);
                                              }}
                                            >
                                              <Send className="h-4 w-4 mr-2" />
                                              Bulk Email
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedEventForModal(event);
                                                setShowEventCancelModal(true);
                                              }}
                                              className="text-orange-600 focus:text-orange-600"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Cancel Event
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteEvent(event.id)}
                                              className="text-red-600 focus:text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      );
                    })()}
                  </>
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
                          value={checkinSearchQuery}
                          onChange={(e) => {
                            setCheckinSearchQuery(e.target.value);
                            // Trigger server-side member search for check-in
                            const val = e.target.value;
                            if (val.length >= 2) {
                              setTimeout(() => fetchMembers(1, 10, val), 400);
                            }
                          }}
                          placeholder="Search by name, phone number, or member ID..."
                          className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                          autoFocus
                          maxLength={100}
                        />
                      </div>
                      
                      {/* Search Results with Check-In Buttons */}
                      {checkinSearchQuery && filteredMembers.length > 0 && (
                        <div className="border-2 border-gray-200 rounded-xl divide-y max-h-96 overflow-y-auto">
                          {filteredMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                {/* Profile Photo */}
                                <div className="h-14 w-14 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                  {member.profileImage ? (
                                    <Image
                                      src={member.profileImage}
                                      alt={member.name}
                                      width={56}
                                      height={56}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-xl">
                                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>

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
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-gray-500 font-mono">ID: {member.qrCode?.slice(0, 20)}...</p>
                                    {member.expiresAt && (
                                      <span className={`text-xs font-medium ${
                                        member.status === 'expired' ? 'text-red-600' :
                                        member.status === 'expiring_soon' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }`}>
                                        <Clock className="inline h-3 w-3 mr-0.5" />
                                        {member.status === 'expired' ? 'Expired: ' : 'Expires: '}
                                        {new Date(member.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
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
                                    pushToast('Cannot check-in: Member subscription has expired', 'error');
                                    return;
                                  }
                                  
                                  if (!member.qrCode) {
                                    console.error('❌ Member has no QR code!', member);
                                    pushToast('This member has no QR code', 'error');
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
                          pushToast(error, 'error');
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
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Contact</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Checked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {checkIns.map((checkin) => (
                          <tr key={checkin.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{checkin.time}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {checkin.profileImage ? (
                                  <Image
                                    src={checkin.profileImage}
                                    alt={checkin.member}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{checkin.member}</p>
                                  <p className="text-xs text-gray-500 font-mono">{checkin.memberId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="text-xs text-gray-600">
                                <p className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {checkin.email || 'N/A'}
                                </p>
                                <p className="flex items-center gap-1 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {checkin.phone || 'N/A'}
                                </p>
                              </div>
                            </td>
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
                            variant={paymentMethod === 'all' ? 'default' : 'outline'}
                            onClick={() => { setPaymentMethod('all'); fetchPaymentHistory(1, 'all'); }}
                            className={paymentMethod === 'all' ? 'bg-gray-700 hover:bg-gray-800' : ''}
                          >
                            All
                          </Button>
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'momo' ? 'default' : 'outline'}
                            onClick={() => { setPaymentMethod('momo'); fetchPaymentHistory(1, 'momo'); }}
                            className={paymentMethod === 'momo' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            MTN MoMo
                          </Button>
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                            onClick={() => { setPaymentMethod('cash'); fetchPaymentHistory(1, 'cash'); }}
                          >
                            Cash
                          </Button>
                          <Button 
                            size="sm" 
                            variant={paymentMethod === 'card' ? 'default' : 'outline'}
                            onClick={() => { setPaymentMethod('card'); fetchPaymentHistory(1, 'card'); }}
                          >
                            Card/Bank
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-700">GH₵ {paymentAnalytics.totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">Success Rate: {paymentAnalytics.paymentSuccessRate}%</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                        <p className="text-2xl font-bold text-yellow-700">{paymentAnalytics.outstandingPayments}</p>
                        <p className="text-xs text-yellow-600 mt-1">GH₵ {paymentAnalytics.outstandingAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Monthly MRR</p>
                        <p className="text-2xl font-bold text-blue-700">
                          GH₵ {paymentAnalytics.monthlyRecurringRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          ARR: GH₵ {paymentAnalytics.annualRecurringRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Payment Methods</p>
                        <div className="text-sm text-gray-700">
                          {paymentAnalytics.paymentMethodBreakdown.slice(0, 2).map((method, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="capitalize">{method.method}:</span>
                              <span className="font-semibold">{method.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="overflow-x-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Payment History</h3>
                        {isLoadingPayments && (
                          <div className="text-sm text-gray-500">Loading payments...</div>
                        )}
                      </div>
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plan</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Reference</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paymentHistory.length > 0 ? (
                            paymentHistory.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-GB') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {payment.member?.name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {payment.member?.plan ? payment.member.plan.replace('_', ' ') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                  {payment.currency} {payment.amount.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                                  {payment.paymentMethod === 'paystack' ? 'Card/Bank' : 
                                   payment.paymentMethod === 'momo' ? 'MTN MoMo' : 
                                   payment.paymentMethod}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    payment.status === 'success' ? 'bg-green-100 text-green-700' :
                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {payment.status === 'success' ? 'Success' : 
                                     payment.status === 'pending' ? 'Pending' : 'Failed'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{payment.reference}</td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    disabled={payment.status !== 'success'}
                                  >
                                    <a
                                      href={`/api/payments/receipt/${payment.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View
                                    </a>
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                {isLoadingPayments ? 'Loading payments...' : 'No payment history found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Payment Pagination Controls */}
                    {paymentTotalPages > 1 && (
                      <div className="mt-4 pt-4 border-t-2 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {((paymentPage - 1) * 10) + 1}-{Math.min(paymentPage * 10, paymentTotal)} of {paymentTotal} transactions
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={paymentPage <= 1}
                            onClick={() => fetchPaymentHistory(paymentPage - 1, paymentMethod)}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm text-gray-700">
                            Page {paymentPage} of {paymentTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={paymentPage >= paymentTotalPages}
                            onClick={() => fetchPaymentHistory(paymentPage + 1, paymentMethod)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
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

        {activeTab === 'receipts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {canManagePayments ? (
              <ReceiptsManager />
            ) : (
              <Card className="border-2 border-red-100 bg-red-50">
                <CardContent className="p-8 text-center">
                  <ShieldAlert className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-red-900 mb-2">Access Restricted</h3>
                  <p className="text-red-700">Only managers can access receipts</p>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {checkInStats?.today || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Today&apos;s Check-Ins</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {checkInStats?.activeNow || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">Active Now</div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-100">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {checkInStats?.thisWeek || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">This Week</div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Table */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Attendance Records</CardTitle>
                    <CardDescription>
                      {filteredCheckIns.length > 0 
                        ? `Showing ${filteredCheckIns.length} filtered records` 
                        : `All check-in records (${checkIns.length} total)`}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-2 w-full sm:w-auto"
                    onClick={handleExportAttendance}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Date Filter */}
                <div className="mb-6 space-y-3">
                  <label className="text-sm font-semibold text-gray-700">Filter by Date Range</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                      <input 
                        type="date" 
                        value={attendanceStartDate}
                        onChange={(e) => setAttendanceStartDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                      <input 
                        type="date" 
                        value={attendanceEndDate}
                        onChange={(e) => setAttendanceEndDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <Button 
                        variant="outline" 
                        className="border-2 flex-1 sm:flex-none"
                        onClick={handleApplyAttendanceFilter}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Apply
                      </Button>
                      {(attendanceStartDate || attendanceEndDate) && (
                        <Button 
                          variant="outline" 
                          className="border-2"
                          onClick={() => {
                            setAttendanceStartDate('');
                            setAttendanceEndDate('');
                            fetchAttendanceHistory(); // Fetch all records
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                {filteredCheckIns.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Check-Ins Yet</h3>
                    <p className="text-gray-600 mb-6">Start checking in members to see attendance records</p>
                    <Button onClick={() => setActiveTab('checkin')} className="bg-orange-500 hover:bg-orange-600">
                      <QrCode className="mr-2 h-4 w-4" />
                      Go to Check-In
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date & Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Member Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Member ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Checked By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredCheckIns.slice((attendancePage - 1) * 50, attendancePage * 50).map((checkin) => {
                            const checkInDate = new Date(checkin.checkInTime);
                            const formattedDate = checkInDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            });
                            const formattedTime = checkInDate.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            });
                            
                            return (
                              <tr key={checkin.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                                  <div className="text-xs text-gray-600">{formattedTime}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-orange-600">
                                        {checkin.member.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{checkin.member}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 font-mono hidden md:table-cell">
                                  {checkin.memberId.slice(0, 8)}...
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    checkin.method === 'qr' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {checkin.method === 'qr' ? <QrCode className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                    {checkin.method === 'qr' ? 'QR Scan' : 'Manual'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                                  {checkin.checkedBy || 'System'}
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Valid
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {filteredCheckIns.length > 50 && (
                      <div className="mt-4 pt-4 border-t-2 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {((attendancePage - 1) * 50) + 1}-{Math.min(attendancePage * 50, filteredCheckIns.length)} of {filteredCheckIns.length} records
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={attendancePage <= 1}
                            onClick={() => setAttendancePage(attendancePage - 1)}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm text-gray-700">
                            Page {attendancePage} of {Math.ceil(filteredCheckIns.length / 50)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={attendancePage >= Math.ceil(filteredCheckIns.length / 50)}
                            onClick={() => setAttendancePage(attendancePage + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
            {/* Analytics Overview Cards */}
            {planAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue (MRR)</p>
                        <p className="text-2xl font-bold text-green-600">
                          GH₵ {planAnalytics.monthlyRecurringRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ARR: GH₵ {planAnalytics.annualRecurringRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Active Subscriptions</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {planAnalytics.totalActiveSubscriptions}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {planAnalytics.totalActivePlans} active plans
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">New (Last 30 Days)</p>
                        <p className="text-2xl font-bold text-purple-600">
                          +{planAnalytics.newSubscriptionsLast30Days}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          +{planAnalytics.newSubscriptionsLast7Days} last 7 days
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Expiring Soon</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {planAnalytics.expiringInNext30Days}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Churn rate: {planAnalytics.churnRate}%
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                {isLoadingFees ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading registration fees...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {registrationFees.map((fee) => (
                      <div key={fee.id} className="bg-white border-2 border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {fee.maxMembers === 1 ? (
                            <User className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Users className="h-5 w-5 text-orange-600" />
                          )}
                          <h3 className="font-bold text-gray-900">{fee.name}</h3>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">{fee.currency} {fee.price}</p>
                        <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                            
                            {/* Enhanced Metrics */}
                            {planAnalytics && planAnalytics.planMetrics && (() => {
                              const planMetric = planAnalytics.planMetrics.find(m => m.plan === (plan.slug || plan.name));
                              if (planMetric) {
                                return (
                                  <>
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                      <span className="text-gray-600 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        New (7d / 30d):
                                      </span>
                                      <span className="font-semibold text-green-600">
                                        +{planMetric.newSubscriptions7Days} / +{planMetric.newSubscriptions30Days}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Expiring Soon:
                                      </span>
                                      <span className="font-semibold text-orange-600">
                                        {planMetric.expiringSoon}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600 flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        Renewal Rate:
                                      </span>
                                      <span className="font-semibold text-blue-600">
                                        {planMetric.renewalRate}%
                                      </span>
                                    </div>
                                  </>
                                );
                              }
                              return null;
                            })()}
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
                    <p className="text-3xl font-bold text-blue-900">
                      {analytics?.revenueGrowth !== undefined 
                        ? `${analytics.revenueGrowth >= 0 ? '+' : ''}${analytics.revenueGrowth.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-blue-700 mt-2">
                      {analytics?.lastMonthRevenue 
                        ? `Last month: GH₵${analytics.lastMonthRevenue.toLocaleString()}`
                        : 'vs last month'}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <Users className="h-8 w-8 text-green-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Member Retention</p>
                    <p className="text-3xl font-bold text-green-900">
                      {analytics?.retentionRate !== undefined 
                        ? `${analytics.retentionRate.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      {analytics?.activeMembers && analytics?.totalMembers
                        ? `${analytics.activeMembers} of ${analytics.totalMembers} active`
                        : 'Based on subscriptions'}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <Activity className="h-8 w-8 text-purple-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Avg. Check-ins/Day</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {analytics?.avgCheckInsPerDay !== undefined 
                        ? analytics.avgCheckInsPerDay
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-purple-700 mt-2">
                      {analytics?.peakCheckIns 
                        ? `Peak: ${analytics.peakCheckIns}`
                        : '30-day average'}
                    </p>
                  </div>
                </div>

                {/* Weekly Check-ins Chart */}
                <div className="mt-6 p-6 border-2 border-gray-200 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Weekly Check-ins</h3>
                      <p className="text-sm text-gray-600">Last 7 days attendance</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-500" />
                  </div>
                  
                  {analytics?.weeklyCheckIns && analytics.weeklyCheckIns.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.weeklyCheckIns.map((day, index) => {
                        const maxCount = Math.max(...analytics.weeklyCheckIns!.map(d => d.count), 1);
                        const percentage = (day.count / maxCount) * 100;
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700 w-12">{day.day}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                                {day.count} check-ins
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No check-in data available</p>
                    </div>
                  )}
                </div>

                {/* Revenue Summary */}
                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">This Month Revenue</p>
                        <p className="text-2xl font-bold text-green-900">
                          GH₵{analytics?.monthlyRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {analytics?.monthlyTransactions || 0} transactions
                    </p>
                  </div>
                  
                  <div className="p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Today&apos;s Activity</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {analytics?.todayCheckIns || 0} check-ins
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {analytics?.attendanceRate || '0%'} of active members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && isManager && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Shield className="h-6 w-6 text-blue-600" />
                      Audit Logs
                    </CardTitle>
                    <CardDescription>Security and activity tracking</CardDescription>
                  </div>
                  <Button variant="outline" className="border-2" onClick={handleExportAuditLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                    <select
                      value={auditLogFilter}
                      onChange={(e) => setAuditLogFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Actions</option>
                      <option value="login">Login</option>
                      <option value="logout">Logout</option>
                      <option value="login_failed">Login Failed</option>
                      <option value="member_created">Member Created</option>
                      <option value="member_updated">Member Updated</option>
                      <option value="member_deleted">Member Deleted</option>
                      <option value="member_suspended">Member Suspended</option>
                      <option value="member_activated">Member Activated</option>
                      <option value="subscription_created">Subscription Created</option>
                      <option value="subscription_updated">Subscription Updated</option>
                      <option value="subscription_cancelled">Subscription Cancelled</option>
                      <option value="subscription_renewed">Subscription Renewed</option>
                      <option value="payment_created">Payment Created</option>
                      <option value="payment_success">Payment Success</option>
                      <option value="payment_failed">Payment Failed</option>
                      <option value="payment_refunded">Payment Refunded</option>
                      <option value="checkin_created">Check-in</option>
                      <option value="checkout_created">Check-out</option>
                      <option value="checkin_manual">Manual Check-in</option>
                      <option value="class_created">Class Created</option>
                      <option value="class_updated">Class Updated</option>
                      <option value="class_deleted">Class Deleted</option>
                      <option value="class_enrolled">Class Enrolled</option>
                      <option value="event_created">Event Created</option>
                      <option value="event_updated">Event Updated</option>
                      <option value="event_deleted">Event Deleted</option>
                      <option value="settings_updated">Settings Updated</option>
                      <option value="staff_created">Staff Created</option>
                      <option value="role_changed">Role Changed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={auditDateRange.start}
                      onChange={(e) => setAuditDateRange({ ...auditDateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={auditDateRange.end}
                      onChange={(e) => setAuditDateRange({ ...auditDateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Audit Logs Table */}
                {isLoadingAuditLogs ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Loading audit logs...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">No Audit Logs</p>
                    <p className="text-sm text-gray-500">Activity logs will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Timestamp</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Entity</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">IP Address</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                                <span className="text-xs text-gray-500">{log.userEmail}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                log.action.includes('login') ? 'bg-green-100 text-green-700' :
                                log.action.includes('logout') ? 'bg-gray-100 text-gray-700' :
                                log.action.includes('created') ? 'bg-blue-100 text-blue-700' :
                                log.action.includes('updated') ? 'bg-yellow-100 text-yellow-700' :
                                log.action.includes('deleted') ? 'bg-red-100 text-red-700' :
                                log.action.includes('payment') ? 'bg-green-100 text-green-700' :
                                log.action.includes('checkin') || log.action.includes('checkout') ? 'bg-purple-100 text-purple-700' :
                                log.action.includes('failed') ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {log.action.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.ipAddress || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-orange-600 hover:bg-orange-50"
                                onClick={() => {
                                  setSelectedAuditLog(log);
                                  setShowAuditLogDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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

        {/* PAR-Q Tab */}
        {activeTab === 'parq' && <ParQManagement />}

        {/* Day Pass Tab */}
        {activeTab === 'daypass' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DayPassManager
              onSellDayPass={() => { fetchDayPassPrice(); setShowDayPassModal(true); }}
              onUpgrade={openUpgradeModal}
              isManager={user?.role === 'MANAGER' || user?.role === 'ADMIN'}
              refreshTrigger={dayPassRefreshTrigger}
            />
          </motion.div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && <AdminSubscriptionManager />}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                  Reports & Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive insights and data analysis
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Lazy load the Reports component */}
            <ReportsAnalytics />
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isManager && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Settings Header with Tabs */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Settings className="h-6 w-6 text-orange-600" />
                      System Settings
                    </CardTitle>
                    <CardDescription>Manage gym configuration and preferences</CardDescription>
                  </div>
                  <Button
                    onClick={saveSettings}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? 'Saving...' : 'Save All Settings'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Settings Navigation Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-200">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'payment', label: 'Payment', icon: CreditCard },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'security', label: 'Security', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id as typeof activeSettingsTab)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
                      activeSettingsTab === tab.id
                        ? 'text-orange-600 border-b-2 border-orange-600 -mb-0.5'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* General Settings Tab */}
            {activeSettingsTab === 'general' && (
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Gym Information</CardTitle>
                  <CardDescription>Basic gym details and operating hours</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gym Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={gymSettings.name}
                        onChange={(e) => setGymSettings({ ...gymSettings, name: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          settingsErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {settingsErrors.name && <p className="text-sm text-red-500 mt-1">{settingsErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                      <input
                        type="text"
                        value={gymSettings.slogan}
                        onChange={(e) => setGymSettings({ ...gymSettings, slogan: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={gymSettings.email}
                        onChange={(e) => setGymSettings({ ...gymSettings, email: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          settingsErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {settingsErrors.email && <p className="text-sm text-red-500 mt-1">{settingsErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={gymSettings.phone}
                        onChange={(e) => setGymSettings({ ...gymSettings, phone: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          settingsErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {settingsErrors.phone && <p className="text-sm text-red-500 mt-1">{settingsErrors.phone}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={gymSettings.address}
                        onChange={(e) => setGymSettings({ ...gymSettings, address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={gymSettings.website}
                        onChange={(e) => setGymSettings({ ...gymSettings, website: e.target.value })}
                        placeholder="https://www.example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                      <select
                        value={gymSettings.timezone}
                        onChange={(e) => setGymSettings({ ...gymSettings, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Africa/Accra">Africa/Accra (GMT)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                      </select>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-4">Operating Hours</h3>
                    <div className="space-y-3">
                      {Object.entries(gymSettings.operatingHours).map(([day, schedule]) => (
                        <div key={day} className="flex items-center gap-4">
                          <label className="w-24 text-sm font-medium text-gray-700 capitalize">{day}</label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!schedule.closed}
                              onChange={(e) => setGymSettings({
                                ...gymSettings,
                                operatingHours: {
                                  ...gymSettings.operatingHours,
                                  [day]: { ...schedule, closed: !e.target.checked }
                                }
                              })}
                              className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-600">Open</span>
                          </label>
                          {!schedule.closed && (
                            <>
                              <input
                                type="time"
                                value={schedule.open}
                                onChange={(e) => setGymSettings({
                                  ...gymSettings,
                                  operatingHours: {
                                    ...gymSettings.operatingHours,
                                    [day]: { ...schedule, open: e.target.value }
                                  }
                                })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={schedule.close}
                                onChange={(e) => setGymSettings({
                                  ...gymSettings,
                                  operatingHours: {
                                    ...gymSettings.operatingHours,
                                    [day]: { ...schedule, close: e.target.value }
                                  }
                                })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </>
                          )}
                          {schedule.closed && <span className="text-gray-500 italic">Closed</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Settings Tab */}
            {activeSettingsTab === 'payment' && (
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Configuration</CardTitle>
                  <CardDescription>Configure payment gateway and billing options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Test Mode Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <p className="font-semibold text-yellow-900">Payment Environment</p>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">Toggle between test and live payment processing</p>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={paymentSettings.testMode}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, testMode: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Test Mode</span>
                    </label>
                  </div>

                  {/* Paystack Credentials */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Paystack Credentials</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Public Key
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.paystackPublicKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackPublicKey: e.target.value })}
                          placeholder={paymentSettings.testMode ? "pk_test_..." : "pk_live_..."}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secret Key <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={paymentSettings.paystackSecretKey}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackSecretKey: e.target.value })}
                          placeholder={paymentSettings.testMode ? "sk_test_..." : "sk_live_..."}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm ${
                            settingsErrors.paystackSecretKey ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {settingsErrors.paystackSecretKey && <p className="text-sm text-red-500 mt-1">{settingsErrors.paystackSecretKey}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Enabled Payment Methods</h3>
                    <div className="space-y-2">
                      {[
                        { id: 'cash', label: 'Cash', icon: DollarSign, description: 'Accept cash payments' },
                        { id: 'momo', label: 'Mobile Money', icon: Phone, description: 'MTN & Vodafone mobile money' },
                        { id: 'card', label: 'Debit/Credit Card', icon: CreditCard, description: 'Visa, Mastercard via Paystack' },
                      ].map((method) => {
                        const Icon = method.icon;
                        return (
                          <label key={method.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentSettings.enabledMethods.includes(method.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    enabledMethods: [...paymentSettings.enabledMethods, method.id]
                                  });
                                } else {
                                  setPaymentSettings({
                                    ...paymentSettings,
                                    enabledMethods: paymentSettings.enabledMethods.filter(m => m !== method.id)
                                  });
                                }
                              }}
                              className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            <Icon className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">{method.label}</p>
                              <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Billing Options */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Billing Options</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={paymentSettings.autoRenewal}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, autoRenewal: e.target.checked })}
                          className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <div>
                          <p className="font-medium text-gray-700">Auto-renewal</p>
                          <p className="text-sm text-gray-500">Automatically renew memberships before expiry</p>
                        </div>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grace Period (Days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={paymentSettings.gracePeriodDays}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, gracePeriodDays: parseInt(e.target.value) || 0 })}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                            settingsErrors.gracePeriodDays ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {settingsErrors.gracePeriodDays && <p className="text-sm text-red-500 mt-1">{settingsErrors.gracePeriodDays}</p>}
                        <p className="text-sm text-gray-500 mt-1">Days members can still access gym after expiry</p>
                      </div>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/settings/test-paystack', {
                            method: 'POST',
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            showToast(data.message || 'Paystack connection successful', 'success');
                          } else {
                            showToast(data.error || 'Paystack connection failed', 'error');
                          }
                        } catch {
                          showToast('Network error testing Paystack connection', 'error');
                        }
                      }}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings Tab */}
            {activeSettingsTab === 'notifications' && (
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  <CardDescription>Configure automated notifications and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <p className="font-medium text-gray-900">Email Notifications</p>
                        </div>
                        <p className="text-sm text-gray-600">Send automated emails to members</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-5 w-5 text-green-600" />
                          <p className="font-medium text-gray-900">SMS Notifications</p>
                        </div>
                        <p className="text-sm text-gray-600">Send SMS alerts to members (charges apply)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Event Notifications</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'membershipExpiry', label: 'Membership Expiry Reminders', description: '7 days before expiration' },
                        { key: 'paymentReminders', label: 'Payment Reminders', description: 'When payment is overdue' },
                        { key: 'classUpdates', label: 'Class Updates', description: 'Schedule changes & cancellations' },
                        { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
                      ].map((setting) => (
                        <label key={setting.key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[setting.key as keyof typeof notificationSettings] as boolean}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, [setting.key]: e.target.checked })}
                            className="mt-0.5 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-700">{setting.label}</p>
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings Tab */}
            {activeSettingsTab === 'security' && (
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Security & Access Control</CardTitle>
                  <CardDescription>Configure security policies and access controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 30 })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          settingsErrors.sessionTimeout ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {settingsErrors.sessionTimeout && <p className="text-sm text-red-500 mt-1">{settingsErrors.sessionTimeout}</p>}
                      <p className="text-sm text-gray-500 mt-1">Auto logout after inactivity</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          settingsErrors.maxLoginAttempts ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {settingsErrors.maxLoginAttempts && <p className="text-sm text-red-500 mt-1">{settingsErrors.maxLoginAttempts}</p>}
                      <p className="text-sm text-gray-500 mt-1">Before account lockout</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Expiry (days)
                      </label>
                      <select
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="0">Never</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-1">Force password change</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                        className="mt-1 w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-5 w-5 text-blue-600" />
                          <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        </div>
                        <p className="text-sm text-gray-600">Require 2FA for all manager accounts (recommended)</p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
        </div>
      </div>

      {/* Member Registration Modal */}
      {showNewMemberModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !registrationSuccess) {
              setShowNewMemberModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {registrationSuccess ? (
              /* Success View with Print Receipt */
              <>
                <div className="p-6 border-b flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Registration Successful</h2>
                  <button
                    onClick={closeRegistrationModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6">
                <div className="text-center">
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

                <div className="flex gap-3">
                  <Button
                    onClick={handlePrintReceipt}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                  <Button
                    onClick={() => {
                      handlePrintReceipt();
                      setTimeout(closeRegistrationModal, 500);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    Print & Close
                  </Button>
                </div>
              </div>
              </div>
              </>
            ) : (
              /* Registration Form */
              <>
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Register New Member</h2>
                    <p className="text-sm text-gray-600 mt-1">Add a new member to the system</p>
                  </div>
                  <button
                    onClick={() => setShowNewMemberModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <form onSubmit={handleRegisterMember} className="space-y-6">
              
              {/* Pending Registration Warning */}
              {pendingRegistration && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">Mobile Money Payment Pending</h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        A payment is pending for <strong>{pendingRegistration.email}</strong>
                      </p>
                      <div className="text-xs text-yellow-700 space-y-1 mb-3">
                        <p>• Reference: {pendingRegistration.reference}</p>
                        <p>• Time remaining: {pendingRegistration.timeRemaining} minutes</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => checkPendingStatus(pendingRegistration.email)}
                          disabled={isCheckingStatus}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingStatus ? 'Checking...' : 'Check Status'}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelPendingRegistration(pendingRegistration.email)}
                          disabled={isCancelling}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel & Register Again'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newMember.firstName}
                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {newMemberErrors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{newMemberErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={newMember.lastName}
                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      {newMemberErrors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{newMemberErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {newMemberErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{newMemberErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {newMemberErrors.phone && (
                      <p className="text-sm text-red-600 mt-1">{newMemberErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={newMember.dateOfBirth}
                      onChange={(e) => setNewMember({ ...newMember, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={newMember.address}
                      onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Street address, city"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Contact *</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={newMember.emergencyContact}
                      onChange={(e) => setNewMember({ ...newMember, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Full name of emergency contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newMember.emergencyPhone}
                      onChange={(e) => setNewMember({ ...newMember, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Emergency contact phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Health Screening (PAR-Q) */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Screening (PAR-Q) *</h3>
                <p className="text-sm text-gray-600 mb-3">Please answer the following health questions:</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasHeartCondition}
                      onChange={(e) => setNewMember({ ...newMember, hasHeartCondition: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Has a doctor ever said you have a heart condition?</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasChestPain}
                      onChange={(e) => setNewMember({ ...newMember, hasChestPain: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Do you feel pain in your chest during physical activity?</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasDizziness}
                      onChange={(e) => setNewMember({ ...newMember, hasDizziness: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Do you lose balance due to dizziness or lose consciousness?</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasJointProblems}
                      onChange={(e) => setNewMember({ ...newMember, hasJointProblems: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Do you have bone or joint problems that could worsen with exercise?</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.takesMedication}
                      onChange={(e) => setNewMember({ ...newMember, takesMedication: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Are you taking medication for blood pressure or heart condition?</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMember.hasOtherConditions}
                      onChange={(e) => setNewMember({ ...newMember, hasOtherConditions: e.target.checked })}
                      className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">Do you have any other health conditions?</span>
                  </label>
                  {newMember.hasOtherConditions && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium mb-1">Please specify:</label>
                      <textarea
                        value={newMember.otherConditionsDetails}
                        onChange={(e) => setNewMember({ ...newMember, otherConditionsDetails: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Describe other health conditions..."
                      />
                    </div>
                  )}
                  {(newMember.hasHeartCondition || newMember.hasChestPain || newMember.hasDizziness || 
                    newMember.hasJointProblems || newMember.takesMedication || newMember.hasOtherConditions) && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Health concerns detected. Staff will review before first visit.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Health Info */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fitness Goals</label>
                    <textarea
                      value={newMember.fitnessGoals}
                      onChange={(e) => setNewMember({ ...newMember, fitnessGoals: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="What are your fitness goals? (e.g., weight loss, muscle gain)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Medical Conditions (Detailed)</label>
                    <textarea
                      value={newMember.medicalConditions}
                      onChange={(e) => setNewMember({ ...newMember, medicalConditions: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="List any medical conditions, allergies, or medications"
                    />
                  </div>
                </div>
              </div>

              {/* Membership Plan */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Membership Plan *</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Select Plan</label>
                  <select
                    value={newMember.plan}
                    onChange={(e) => {
                      const plan = e.target.value;
                      setNewMember({
                        ...newMember,
                        plan,
                        amountPaid: String(getExpectedAmount(plan)),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ONE_MONTH">1 Month: GH₵ 200</option>
                    <option value="THREE_MONTHS">3 Months: GH₵ 500</option>
                    <option value="ONE_YEAR">1 Year: GH₵ 2,200</option>
                  </select>
                </div>
              </div>

              {/* Payment Collection */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details *</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Method *</label>
                    <select
                      value={newMember.paymentMethod}
                      onChange={(e) => setNewMember({ ...newMember, paymentMethod: e.target.value as 'CASH' | 'MOMO' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="MOMO">Mobile Money (MoMo), Paystack USSD</option>
                    </select>
                  </div>

                  {/* The amount is locked for MoMo and editable for cash payments. */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (GH₵) *</label>
                    <input
                      type="number"
                      required
                      readOnly={newMember.paymentMethod === 'MOMO'}
                      value={newMember.amountPaid || String(getExpectedAmount(newMember.plan))}
                      onChange={(e) => {
                        if (newMember.paymentMethod !== 'MOMO') {
                          setNewMember({ ...newMember, amountPaid: e.target.value });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        newMemberErrors.amountPaid
                          ? 'border-red-500'
                          : newMember.paymentMethod === 'MOMO'
                          ? 'border-amber-300 bg-amber-50 text-amber-900 cursor-not-allowed'
                          : 'border-gray-300'
                      }`}
                      step="0.01"
                      min="0"
                    />
                    {newMemberErrors.amountPaid && (
                      <p className="text-xs text-red-600 mt-1">{newMemberErrors.amountPaid}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Registration fee only. The member gets <span className="font-semibold text-orange-600">30 days FREE</span>.
                      First renewal: GH₵ {PLAN_PRICING[newMember.plan as keyof typeof PLAN_PRICING]?.price ?? 200} ({newMember.plan.replace(/_/g, ' ').toLowerCase()})
                    </p>
                  </div>

                </div>
              </div>

              {/* Auto-generated password info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ A secure password will be auto-generated and printed on the receipt.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
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
        </>
      )}
    </div>
  </div>
)}

{/* Day Pass Modal */}
{showDayPassModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget && !dayPassSuccess && !dayPassPending) closeDayPassModal();
    }}
  >
    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      {dayPassPending && dayPassResult ? (
        /* MoMo Pending State */
        <>
          <div className="p-6 border-b flex items-center justify-between bg-yellow-50">
            <h2 className="text-2xl font-bold text-yellow-900">Awaiting Payment</h2>
            <button onClick={closeDayPassModal} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-3">
                <Loader2 className="h-12 w-12 text-yellow-600 animate-spin" />
              </div>
              <p className="text-lg font-semibold text-yellow-900">
                Waiting for Mobile Money Payment
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                USSD prompt sent to {dayPassResult.phone}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium">{dayPassResult.firstName} {dayPassResult.lastName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-yellow-600">GH₵ {dayPassResult.price}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Provider</span>
                <span className="font-medium">{dayPassResult.provider || 'Mobile Money'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono text-xs">{dayPassResult.reference}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">📱 Instructions for Customer:</p>
              <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
                <li>Check your phone for USSD prompt</li>
                <li>Enter your Mobile Money PIN</li>
                <li>Confirm the payment</li>
                <li>Wait for confirmation message</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Payment will be automatically verified. This may take 10-30 seconds after customer completes the USSD prompt.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={() => {
                  closeDayPassModal();
                  setActiveTab('receipts');
                }}
                variant="outline" 
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Check Receipts Tab
              </Button>
              <Button onClick={closeDayPassModal} className="flex-1 bg-gray-500 hover:bg-gray-600">
                Close
              </Button>
            </div>
          </div>
        </>
      ) : dayPassSuccess && dayPassResult ? (
        /* Day Pass Success */
        <>
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Day Pass Sold!</h2>
            <button onClick={closeDayPassModal} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {/* Late Purchase Warning */}
            {dayPassResult.latePurchaseWarning && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Late Purchase Warning</p>
                  <p className="text-xs text-amber-700 mt-0.5">{dayPassResult.latePurchaseWarning}</p>
                  <p className="text-xs text-amber-600 mt-1">Pass expires at midnight tonight.</p>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-800">
                {dayPassResult.firstName} {dayPassResult.lastName}
              </p>
              <p className="text-sm text-green-600">has been checked in</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium">{dayPassResult.phone}</span>
              </div>
              {dayPassResult.email && !dayPassResult.email.includes('@gemfitness.local') && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-xs">{dayPassResult.email}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-green-600">GH₵ {dayPassResult.price}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono text-xs">{dayPassResult.reference}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Valid Until</span>
                <span className="font-medium">Today, Midnight</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Payment</span>
                <span className="font-medium">{dayPassForm.paymentMethod}</span>
              </div>
              {dayPassResult.emergencyContact && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Emergency Contact</span>
                  <span className="font-medium text-xs">{dayPassResult.emergencyContact} • {dayPassResult.emergencyPhone}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-3">
                <Button 
                  onClick={printDayPassReceipt} 
                  variant="outline" 
                  className="flex-1 border-2 border-green-500 text-green-700 hover:bg-green-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                {dayPassResult.transactionId && (
                  <Button 
                    asChild
                    variant="outline" 
                    className="flex-1 border-2 border-blue-500 text-blue-700 hover:bg-blue-50"
                  >
                    <a
                      href={`/api/payments/receipt/${dayPassResult.transactionId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Receipt
                    </a>
                  </Button>
                )}
              </div>
              {/* Upgrade to Member Button */}
              {dayPassResult.userId && (
                <Button 
                  onClick={() => dayPassResult.userId && openUpgradeModal(dayPassResult.userId)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to Full Member
                </Button>
              )}
              <Button onClick={closeDayPassModal} className="w-full bg-orange-500 hover:bg-orange-600">
                Done
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Day Pass Form */
        <>
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sell Day Pass</h2>
              <p className="text-sm text-gray-600 mt-1">
                Quick access for walk-in visitors • <span className="font-semibold text-green-600">GH₵ {dayPassPrice}</span>
              </p>
            </div>
            <button onClick={closeDayPassModal} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSellDayPass} className="space-y-4">
              {/* Membership Suggestion Alert (for repeat customers) */}
              {dayPassUsage && dayPassUsage.shouldSuggestMembership && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 text-sm mb-1">💡 Membership Suggestion</h4>
                      <p className="text-sm text-blue-800 mb-2">{dayPassUsage.suggestMembershipReason}</p>
                      <div className="flex items-center gap-4 text-xs bg-white/60 rounded-lg p-2.5 mb-2">
                        <div>
                          <span className="text-blue-600 font-medium">Visits this month:</span>
                          <span className="ml-1.5 font-bold text-blue-900">{dayPassUsage.last30DaysPasses + 1}</span>
                        </div>
                        <div className="h-4 w-px bg-blue-300"></div>
                        <div>
                          <span className="text-blue-600 font-medium">Total spent:</span>
                          <span className="ml-1.5 font-bold text-blue-900">GH₵{dayPassUsage.totalSpent + dayPassPrice}</span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 italic">
                        💰 Suggest upgrading to save money on unlimited access
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={dayPassForm.firstName}
                    onChange={(e) => setDayPassForm({ ...dayPassForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="John"
                  />
                  {dayPassErrors.firstName && <p className="text-xs text-red-600 mt-1">{dayPassErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={dayPassForm.lastName}
                    onChange={(e) => setDayPassForm({ ...dayPassForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Doe"
                  />
                  {dayPassErrors.lastName && <p className="text-xs text-red-600 mt-1">{dayPassErrors.lastName}</p>}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={dayPassForm.phone}
                  onChange={(e) => setDayPassForm({ ...dayPassForm, phone: e.target.value })}
                  onBlur={(e) => checkDayPassVisitor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="024 123 4567"
                  pattern="[0-9\s\-\+\(\)]+"
                />
                <p className="text-xs text-gray-500 mt-1">Used to check for returning visitors</p>
                {dayPassErrors.phone && <p className="text-xs text-red-600 mt-1">{dayPassErrors.phone}</p>}
              </div>

              {/* Email (optional - used for MoMo & receipts) */}
              <div>
                <label className="block text-sm font-medium mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={dayPassForm.email}
                  onChange={(e) => setDayPassForm({ ...dayPassForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="guest@example.com"
                />
                {dayPassForm.paymentMethod === 'MOMO' && (
                  <p className="text-xs text-amber-600 mt-1">Recommended for MoMo payments &amp; receipt delivery</p>
                )}
                {dayPassErrors.email && <p className="text-xs text-red-600 mt-1">{dayPassErrors.email}</p>}
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={dayPassForm.emergencyContact}
                      onChange={(e) => setDayPassForm({ ...dayPassForm, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contact name"
                    />
                    {dayPassErrors.emergencyContact && <p className="text-xs text-red-600 mt-1">{dayPassErrors.emergencyContact}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={dayPassForm.emergencyPhone}
                      onChange={(e) => setDayPassForm({ ...dayPassForm, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0XX XXX XXXX"
                    />
                    {dayPassErrors.emergencyPhone && <p className="text-xs text-red-600 mt-1">{dayPassErrors.emergencyPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDayPassForm({ ...dayPassForm, paymentMethod: 'CASH' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                      dayPassForm.paymentMethod === 'CASH'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayPassForm({ ...dayPassForm, paymentMethod: 'MOMO' })}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                      dayPassForm.paymentMethod === 'MOMO'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Phone className="h-5 w-5" />
                    <span className="font-medium">MoMo</span>
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Day Pass</span>
                  <span className="text-xl font-bold text-green-600">GH₵ {dayPassPrice}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Valid for today only. No registration fee.</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDayPassModal} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingDayPass}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessingDayPass ? 'Processing...' : `Sell Day Pass • GH₵ ${dayPassPrice}`}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  </div>
)}

{/* Upgrade to Member Modal */}
{showUpgradeModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    onClick={(e) => {
      if (e.target === e.currentTarget && !upgradeSuccess) closeUpgradeModal();
    }}
  >
    <div className="bg-white rounded-lg max-w-2xl w-full my-8 shadow-2xl">
      {upgradeSuccess && upgradedMemberData ? (
        /* Upgrade Success */
        <>
          <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-purple-900">Upgrade Successful! 🎉</h2>
            <button onClick={closeUpgradeModal} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-16 w-16 text-purple-500 mx-auto mb-3" />
              <p className="text-xl font-semibold text-purple-900">
                {upgradedMemberData.firstName} {upgradedMemberData.lastName}
              </p>
              <p className="text-sm text-purple-700">is now a full member!</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium">{upgradedMemberData.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium">{upgradedMemberData.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium text-purple-700">{upgradedMemberData.planName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-green-600">GH₵ {upgradedMemberData.amountPaid}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Reference</span>
                <span className="font-mono text-xs">{upgradedMemberData.reference}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ✅ <strong>Member can now:</strong> Access all gym facilities, attend classes, and check in using their QR code.
              </p>
            </div>

            <Button onClick={closeUpgradeModal} className="w-full bg-purple-600 hover:bg-purple-700">
              Done
            </Button>
          </div>
        </>
      ) : (
        /* Upgrade Form */
        <>
          <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-purple-900">Upgrade to Full Member</h2>
                {upgradeUserData && (
                  <p className="text-sm text-purple-700 mt-1">
                    {upgradeUserData.firstName} {upgradeUserData.lastName} • {upgradeUserData.phone}
                  </p>
                )}
              </div>
              <button onClick={closeUpgradeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <form onSubmit={handleUpgrade} className="space-y-5">
              {/* Plan Selection */}
              {upgradePlans && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Membership Plan *</label>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(upgradePlans).map(([key, plan]) => (
                      <div
                        key={key}
                        onClick={() => setUpgradeFormData({ ...upgradeFormData, plan: key as 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR' })}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          upgradeFormData.plan === key
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              upgradeFormData.plan === key ? 'border-purple-500' : 'border-gray-300'
                            }`}>
                              {upgradeFormData.plan === key && (
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{plan.name}</p>
                              <p className="text-xs text-gray-500">{plan.durationDays} days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-700">GH₵ {plan.price}</p>
                            <p className="text-xs text-gray-500">Full price</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email (if needed) */}
              {upgradeUserData?.needsEmail && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={upgradeFormData.email}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${upgradeErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="member@example.com"
                  />
                  {upgradeErrors.email && <p className="text-xs text-red-600 mt-1">{upgradeErrors.email}</p>}
                </div>
              )}

              {/* Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Create Password *</label>
                  <input
                    type="password"
                    required
                    value={upgradeFormData.password}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Minimum 6 characters"
                  />
                  {upgradeErrors.password && <p className="text-xs text-red-600 mt-1">{upgradeErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={upgradeFormData.confirmPassword}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Re-enter password"
                  />
                  {upgradeErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{upgradeErrors.confirmPassword}</p>}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={upgradeFormData.dateOfBirth}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, dateOfBirth: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${upgradeErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {upgradeErrors.dateOfBirth && <p className="text-xs text-red-600 mt-1">{upgradeErrors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={upgradeFormData.address}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={upgradeFormData.emergencyContact}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, emergencyContact: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${upgradeErrors.emergencyContact ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Full name"
                  />
                  {upgradeErrors.emergencyContact && <p className="text-xs text-red-600 mt-1">{upgradeErrors.emergencyContact}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={upgradeFormData.emergencyPhone}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, emergencyPhone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${upgradeErrors.emergencyPhone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Phone number"
                  />
                  {upgradeErrors.emergencyPhone && <p className="text-xs text-red-600 mt-1">{upgradeErrors.emergencyPhone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fitness Goals</label>
                <textarea
                  value={upgradeFormData.fitnessGoals}
                  onChange={(e) => setUpgradeFormData({ ...upgradeFormData, fitnessGoals: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What do you want to achieve? (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Medical Conditions</label>
                <textarea
                  value={upgradeFormData.medicalConditions}
                  onChange={(e) => setUpgradeFormData({ ...upgradeFormData, medicalConditions: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Any medical conditions, allergies, or medications? (optional)"
                />
              </div>

              {/* PAR-Q */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Physical Activity Readiness Questionnaire (PAR-Q)</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { key: 'hasHeartCondition', label: 'Do you have a heart condition?' },
                    { key: 'hasChestPain', label: 'Do you feel chest pain during physical activity?' },
                    { key: 'hasDizziness', label: 'Do you experience dizziness or loss of balance?' },
                    { key: 'hasJointProblems', label: 'Do you have bone or joint problems?' },
                    { key: 'takesMedication', label: 'Are you currently taking medication for blood pressure or heart?' },
                    { key: 'hasOtherConditions', label: 'Do you have any other medical conditions?' },
                  ].map((q) => (
                    <label key={q.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={upgradeFormData[q.key as keyof typeof upgradeFormData] as boolean}
                        onChange={(e) => setUpgradeFormData({ ...upgradeFormData, [q.key]: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span>{q.label}</span>
                    </label>
                  ))}
                </div>
                {upgradeFormData.hasOtherConditions && (
                  <div className="mt-3">
                    <textarea
                      value={upgradeFormData.otherConditionsDetails}
                      onChange={(e) => setUpgradeFormData({ ...upgradeFormData, otherConditionsDetails: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Please provide details"
                    />
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Payment</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={upgradeFormData.paymentMethod === 'CASH'}
                      onChange={(e) => setUpgradeFormData({ ...upgradeFormData, paymentMethod: e.target.value as 'CASH' | 'MOMO' })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="font-medium">Cash</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MOMO"
                      checked={upgradeFormData.paymentMethod === 'MOMO'}
                      onChange={(e) => setUpgradeFormData({ ...upgradeFormData, paymentMethod: e.target.value as 'CASH' | 'MOMO' })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="font-medium">MTN MoMo</span>
                  </label>
                </div>
                {upgradeFormData.paymentMethod === 'MOMO' && (
                  <input
                    type="text"
                    value={upgradeFormData.momoReference}
                    onChange={(e) => setUpgradeFormData({ ...upgradeFormData, momoReference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="MoMo Reference (optional)"
                  />
                )}
                {upgradePlans && (
                  <div className="bg-purple-50 rounded-lg p-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Total to Pay:</span>
                      <span className="text-2xl font-bold text-purple-900">
                        GH₵ {upgradePlans[upgradeFormData.plan].price}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeUpgradeModal} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingUpgrade}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isProcessingUpgrade ? 'Processing...' : 'Complete Upgrade'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  </div>
)}

{/* Registration Success Modal */}
      {showCheckInModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCheckInModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Member Check-In</h2>
                  <p className="text-sm text-gray-600 mt-1">Scan or enter member QR code</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
            <form id="check-in-form" onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-4">
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
            </form>
            </div>
            <div className="p-6 border-t flex gap-3">
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
                form="check-in-form"
                disabled={isCheckingIn}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {isCheckingIn ? 'Checking In...' : 'Check In Member'}
              </Button>
            </div>
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

      {/* Duplicate Check-In Warning Modal */}
      {showDuplicateWarning && duplicateCheckInInfo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDuplicateWarning(false);
              setDuplicateCheckInInfo(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Duplicate Check-In</h2>
                  <p className="text-sm text-gray-600 mt-1">Member already checked in</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateCheckInInfo(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Last Check-In:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Time:</span>
                  <span>{duplicateCheckInInfo.lastCheckIn.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Method:</span>
                  <span className="capitalize">{duplicateCheckInInfo.lastCheckIn.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Checked By:</span>
                  <span>{duplicateCheckInInfo.lastCheckIn.checkedBy}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {user?.role === 'MANAGER' || user?.role === 'ADMIN' 
                ? 'As a manager/admin, you can override this warning and check in again.'
                : 'Please verify this is not a duplicate scan. Contact a manager if needed.'}
            </p>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  setDuplicateCheckInInfo(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                <Button
                  type="button"
                  onClick={handleForceCheckIn}
                  disabled={isCheckingIn}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {isCheckingIn ? 'Checking In...' : 'Continue Anyway'}
                </Button>
              )}
            </div>
          </div>
        </div>
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
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingClass ? 'Edit Class' : 'Create New Class'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingClass ? 'Update class details' : 'Add a new fitness class'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeClassModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                  <p className="text-xs text-gray-500 mt-1">Specify days and time (e.g., &quot;Mon, Wed, Fri - 6:30 AM&quot;)</p>
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
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {editingEvent ? 'Update event details' : 'Add a new fitness event'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEventModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                  <label className="block text-sm font-medium mb-2">Event Image (Optional)</label>
                  
                  {/* File Upload Button */}
                  <div className="mb-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {isUploadingImage ? 'Processing...' : 'Choose Image from Device'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEventImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Select from your computer (Max 5MB: JPG, PNG, WEBP, GIF)</p>
                  </div>
                  
                  {/* Image Preview */}
                  {eventImagePreview && (
                    <div className="mt-3 relative">
                      <p className="text-xs font-medium text-gray-700 mb-2">Image Preview:</p>
                      <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image 
                          src={eventImagePreview} 
                          alt="Event preview" 
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="flex items-center justify-center h-full text-sm text-red-500"><p>⚠️ Failed to load image</p></div>';
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveEventImage}
                        className="absolute top-6 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Tips */}
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <p className="font-semibold text-blue-900 mb-1">📸 Image Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                      <li>Recommended size: 1200x675px (16:9 ratio)</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Supported formats: JPG, PNG, WEBP, GIF</li>
                      <li>Use high-quality, landscape-oriented images for best results</li>
                    </ul>
                  </div>
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Regular Ticket Price (GH₵) *</label>
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

                    </div>
                  )}
                </div>

                {/* Event Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Event Category</label>
                  <select
                    value={eventFormData.category}
                    onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="WORKSHOP">Workshop</option>
                    <option value="COMPETITION">Competition</option>
                    <option value="SOCIAL">Social Event</option>
                    <option value="TRAINING">Training Session</option>
                    <option value="WELLNESS">Wellness</option>
                    <option value="CHARITY">Charity/Fundraiser</option>
                    <option value="CELEBRATION">Celebration</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">Categorize your event for better organization</p>
                </div>

                {/* Event Tags */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (Optional)</label>
                  <input
                    type="text"
                    value={eventFormData.tags}
                    onChange={(e) => setEventFormData({ ...eventFormData, tags: e.target.value })}
                    placeholder="e.g., beginner, nutrition, outdoor (comma-separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">Add tags separated by commas for easier filtering</p>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-1">Event Status</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="cancelEvent"
                        checked={eventFormData.status === 'CANCELLED'}
                        onChange={(e) => setEventFormData({ 
                          ...eventFormData, 
                          status: e.target.checked ? 'CANCELLED' : 'UPCOMING'
                        })}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                      />
                      <label htmlFor="cancelEvent" className="text-sm font-medium text-gray-700">
                        Mark event as CANCELLED
                      </label>
                    </div>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                      ℹ️ <strong>Status is auto-calculated:</strong> UPCOMING, ONGOING, and COMPLETED are determined by event dates. Only use the checkbox above to manually cancel an event.
                    </p>
                  </div>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddStaffModal(false);
              setStaffError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Staff</h2>
                  <p className="text-sm text-gray-600 mt-1">Add a new staff member to the system</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setStaffError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as 'RECEPTIONIST' | 'MANAGER' | 'ADMIN' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditStaffModal(false);
              setSelectedStaff(null);
              setStaffError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Staff Member</h2>
                  <p className="text-sm text-gray-600 mt-1">Update staff member details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditStaffModal(false);
                  setSelectedStaff(null);
                  setStaffError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                    onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value as 'RECEPTIONIST' | 'MANAGER' | 'ADMIN' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteStaffModal(false);
              setSelectedStaff(null);
              setStaffError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delete Staff Member</h2>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteStaffModal(false);
                  setSelectedStaff(null);
                  setStaffError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {staffError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {staffError}
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold">{selectedStaff.firstName} {selectedStaff.lastName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t flex gap-3">
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
      )}

      {/* Add Trainer Modal */}
      {showAddTrainerModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddTrainerModal(false);
              setTrainerError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Trainer</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new trainer profile</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddTrainerModal(false);
                  setTrainerError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {trainerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {trainerError}
                </div>
              )}
              <form onSubmit={handleAddTrainer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={trainerFormData.name}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={trainerFormData.email}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={trainerFormData.phone}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Specializations</label>
                  <input
                    type="text"
                    value={trainerFormData.specializations}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, specializations: e.target.value })}
                    placeholder="e.g., strength training, yoga, HIIT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Certifications</label>
                  <input
                    type="text"
                    value={trainerFormData.certifications}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, certifications: e.target.value })}
                    placeholder="e.g., ACE, NASM, CPR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={trainerFormData.bio}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Weekly Hours</label>
                    <input
                      type="number"
                      min={1}
                      value={trainerFormData.maxWeeklyHours}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, maxWeeklyHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Days</label>
                    <input
                      type="text"
                      value={trainerFormData.preferredDays}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, preferredDays: e.target.value })}
                      placeholder="e.g., Monday, Wednesday"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Times</label>
                  <input
                    type="text"
                    value={trainerFormData.preferredTimes}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, preferredTimes: e.target.value })}
                    placeholder="e.g., mornings, evenings"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddTrainerModal(false);
                      setTrainerError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingTrainer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingTrainer ? 'Adding...' : 'Add Trainer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {showEditTrainerModal && selectedTrainer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditTrainerModal(false);
              setSelectedTrainer(null);
              setTrainerError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Trainer</h2>
                  <p className="text-sm text-gray-600 mt-1">Update trainer profile</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditTrainerModal(false);
                  setSelectedTrainer(null);
                  setTrainerError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {trainerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {trainerError}
                </div>
              )}
              <form onSubmit={handleEditTrainer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={trainerFormData.name}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={trainerFormData.email}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={trainerFormData.phone}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Specializations</label>
                  <input
                    type="text"
                    value={trainerFormData.specializations}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, specializations: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Certifications</label>
                  <input
                    type="text"
                    value={trainerFormData.certifications}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, certifications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={trainerFormData.bio}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Weekly Hours</label>
                    <input
                      type="number"
                      min={1}
                      value={trainerFormData.maxWeeklyHours}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, maxWeeklyHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preferred Days</label>
                    <input
                      type="text"
                      value={trainerFormData.preferredDays}
                      onChange={(e) => setTrainerFormData({ ...trainerFormData, preferredDays: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Times</label>
                  <input
                    type="text"
                    value={trainerFormData.preferredTimes}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, preferredTimes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={trainerFormData.status}
                    onChange={(e) => setTrainerFormData({ ...trainerFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditTrainerModal(false);
                      setSelectedTrainer(null);
                      setTrainerError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingTrainer}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingTrainer ? 'Updating...' : 'Update Trainer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Trainer Confirmation Modal */}
      {showDeactivateTrainerModal && selectedTrainer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeactivateTrainerModal(false);
              setSelectedTrainer(null);
              setTrainerError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Deactivate Trainer</h2>
                  <p className="text-sm text-gray-600 mt-1">This action will set the trainer to inactive</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeactivateTrainerModal(false);
                  setSelectedTrainer(null);
                  setTrainerError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {trainerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {trainerError}
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to deactivate <span className="font-semibold">{selectedTrainer.name}</span>?
              </p>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeactivateTrainerModal(false);
                  setSelectedTrainer(null);
                  setTrainerError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeactivateTrainer}
                disabled={isSubmittingTrainer}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isSubmittingTrainer ? 'Deactivating...' : 'Deactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {showDeleteMemberModal && selectedMember && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteMemberModal(false);
              setSelectedMember(null);
              setMemberError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Delete Member</h2>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteMemberModal(false);
                  setSelectedMember(null);
                  setMemberError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {memberError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {memberError}
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold">{selectedMember.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteMemberModal(false);
                  setSelectedMember(null);
                  setMemberError(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteMember}
                disabled={isSubmittingMember}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isSubmittingMember ? 'Deleting...' : 'Delete Member'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Member Modal */}
      {showSuspendModal && memberToSuspend && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuspendModal(false);
              setMemberToSuspend(null);
              setSuspendReason('');
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Suspend Member</h2>
                  <p className="text-sm text-gray-600 mt-1">Membership will be paused</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setMemberToSuspend(null);
                  setSuspendReason('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Are you sure you want to suspend <span className="font-semibold">{memberToSuspend.name}</span>? Their subscription will be paused until reactivated.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Suspension *</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspending this member..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{suspendReason.length}/500</p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSuspendModal(false);
                  setMemberToSuspend(null);
                  setSuspendReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSuspendMember}
                disabled={isSuspending || !suspendReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isSuspending ? 'Suspending...' : 'Suspend Member'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddPlanModal(false);
              setPlanError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Add a new membership plan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddPlanModal(false);
                  setPlanError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditPlanModal(false);
              setSelectedPlan(null);
              setPlanError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Membership Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Update plan details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditPlanModal(false);
                  setSelectedPlan(null);
                  setPlanError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
                    className="flex-1 bg-green-600 hover:bg-green-700"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeletePlanModal(false);
              setSelectedPlan(null);
              setPlanError(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Archive Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Plan will be archived, not deleted</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeletePlanModal(false);
                  setSelectedPlan(null);
                  setPlanError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {planError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {planError}
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to archive <span className="font-semibold">{selectedPlan.name}</span>? 
                This will prevent new subscriptions but won&apos;t affect existing members.
              </p>
            </div>
            <div className="p-6 border-t flex gap-3">
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
      )}

      {/* Change History Modal */}
      {showChangeHistoryModal && selectedPlan && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChangeHistoryModal(false);
              setSelectedPlan(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Plan Change History</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPlan.name} - Version history</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChangeHistoryModal(false);
                  setSelectedPlan(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
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
            <div className="p-6 border-t flex gap-3">
              <Button
                onClick={() => {
                  setShowChangeHistoryModal(false);
                  setSelectedPlan(null);
                  setChangeHistory([]);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      editMemberFieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {editMemberFieldErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{editMemberFieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editMemberFormData.lastName}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, lastName: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      editMemberFieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {editMemberFieldErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{editMemberFieldErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editMemberFormData.email}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, email: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      editMemberFieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {editMemberFieldErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{editMemberFieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={editMemberFormData.phone}
                    onChange={(e) => setEditMemberFormData({ ...editMemberFormData, phone: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      editMemberFieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {editMemberFieldErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{editMemberFieldErrors.phone}</p>
                  )}
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

                <div className="md:col-span-2">
                  <ProfilePictureUpload
                    currentImage={selectedMember?.profileImage || null}
                    userId={selectedMember?.id || ''}
                    isStaffMode={true}
                    onUploadSuccess={() => {
                      // Refresh members list
                      fetchMembers();
                    }}
                  />
                </div>
              </div>
              <div className="p-6 border-t flex gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setSelectedMember(null);
                    setMemberEditError(null);
                    setEditMemberFieldErrors({});
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isUpdatingMember}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={isUpdatingMember}
                >
                  {isUpdatingMember ? 'Updating...' : 'Update Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Feature Modals */}
      
      {/* Waitlist Modal */}
      {showWaitlistModal && selectedClassForModal && (
        <WaitlistModal
          isOpen={showWaitlistModal}
          onClose={() => {
            setShowWaitlistModal(false);
            setSelectedClassForModal(null);
          }}
          classData={{
            id: selectedClassForModal.id,
            name: selectedClassForModal.name,
            instructor: selectedClassForModal.instructor,
            schedule: selectedClassForModal.schedule,
            maxCapacity: selectedClassForModal.maxCapacity,
            enrolled: selectedClassForModal.enrolled,
          }}
        />
      )}

      {/* Class Reviews Modal */}
      {showClassReviewsModal && selectedClassForModal && (
        <ClassReviewsModal
          isOpen={showClassReviewsModal}
          onClose={() => {
            setShowClassReviewsModal(false);
            setSelectedClassForModal(null);
          }}
          classData={{
            id: selectedClassForModal.id,
            name: selectedClassForModal.name,
            instructor: selectedClassForModal.instructor,
            type: selectedClassForModal.type,
          }}
        />
      )}

      {/* Bulk Email Modal */}
      {showBulkEmailModal && selectedEventForModal && (
        <BulkEmailModal
          isOpen={showBulkEmailModal}
          onClose={() => {
            setShowBulkEmailModal(false);
            setSelectedEventForModal(null);
          }}
          eventData={{
            id: selectedEventForModal.id,
            title: selectedEventForModal.title,
            eventDate: selectedEventForModal.eventDate,
            location: selectedEventForModal.location,
            registered: selectedEventForModal.registered,
          }}
        />
      )}

      {/* Member Details Modal */}
      {showMemberDetailsModal && selectedMember && (
        <MemberDetailsModal
          isOpen={showMemberDetailsModal}
          isLoading={isFetchingMemberDetails}
          onClose={() => {
            setShowMemberDetailsModal(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
        />
      )}

      {/* Member Class History Modal */}
      {showMemberClassHistoryModal && selectedMember && (
        <MemberClassHistoryModal
          isOpen={showMemberClassHistoryModal}
          onClose={() => {
            setShowMemberClassHistoryModal(false);
            setSelectedMember(null);
          }}
          memberData={{
            id: selectedMember.id,
            name: selectedMember.name,
            email: selectedMember.email,
          }}
        />
      )}

      {/* Class Enrollment Modal */}
      {showClassEnrollmentModal && selectedClassForModal && (
        <ClassEnrollmentModal
          isOpen={showClassEnrollmentModal}
          onClose={() => {
            setShowClassEnrollmentModal(false);
            setSelectedClassForModal(null);
          }}
          classData={{
            id: selectedClassForModal.id,
            name: selectedClassForModal.name,
            instructor: selectedClassForModal.instructor,
            schedule: selectedClassForModal.schedule,
            maxCapacity: selectedClassForModal.maxCapacity,
            enrolled: selectedClassForModal.enrolled,
          }}
        />
      )}

      {/* Class Attendance Modal - Linked to General Check-ins */}
      {showClassAttendanceModal && selectedClassForModal && (
        <ClassAttendanceModal
          isOpen={showClassAttendanceModal}
          onClose={() => {
            setShowClassAttendanceModal(false);
            setSelectedClassForModal(null);
          }}
          classData={{
            id: selectedClassForModal.id,
            name: selectedClassForModal.name,
            instructor: selectedClassForModal.instructor,
            schedule: selectedClassForModal.schedule,
            duration: selectedClassForModal.duration,
          }}
        />
      )}

      {/* Class Details Modal */}
      {showClassDetailsModal && selectedClassForModal && (
        <ClassDetailsModal
          isOpen={showClassDetailsModal}
          onClose={() => {
            setShowClassDetailsModal(false);
            setSelectedClassForModal(null);
          }}
          classData={{
            id: selectedClassForModal.id,
            name: selectedClassForModal.name,
            ...(selectedClassForModal.description !== undefined && { description: selectedClassForModal.description }),
            type: selectedClassForModal.type,
            instructor: selectedClassForModal.instructor,
            duration: selectedClassForModal.duration,
            maxCapacity: selectedClassForModal.maxCapacity,
            enrolled: selectedClassForModal.enrolled,
            schedule: selectedClassForModal.schedule,
            ...(selectedClassForModal.color !== undefined && { color: selectedClassForModal.color }),
            status: selectedClassForModal.status,
            ...(selectedClassForModal.rating !== undefined && { rating: selectedClassForModal.rating }),
            ...(selectedClassForModal.waitlistCount !== undefined && { waitlistCount: selectedClassForModal.waitlistCount }),
            ...(selectedClassForModal.totalReviews !== undefined && { totalReviews: selectedClassForModal.totalReviews }),
          }}
          onManageEnrollments={() => {
            setShowClassDetailsModal(false);
            setShowClassEnrollmentModal(true);
          }}
          onViewAttendance={() => {
            setShowClassDetailsModal(false);
            setShowClassAttendanceModal(true);
          }}
          onEdit={() => {
            setShowClassDetailsModal(false);
            openClassModal(selectedClassForModal);
          }}
        />
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEventForModal && (
        <EventDetailsModal
          isOpen={showEventDetailsModal}
          onClose={() => {
            setShowEventDetailsModal(false);
            setSelectedEventForModal(null);
          }}
          eventData={{
            id: selectedEventForModal.id,
            title: selectedEventForModal.title,
            description: selectedEventForModal.description,
            eventDate: selectedEventForModal.eventDate,
            endDate: selectedEventForModal.endDate ?? null,
            location: selectedEventForModal.location,
            ...(selectedEventForModal.image && { image: selectedEventForModal.image }),
            ...(selectedEventForModal.maxAttendees !== undefined && { maxAttendees: selectedEventForModal.maxAttendees }),
            registered: selectedEventForModal.registered,
            isFree: selectedEventForModal.isFree,
            ...(selectedEventForModal.price !== undefined && { price: selectedEventForModal.price }),
            status: selectedEventForModal.status,
          }}
        />
      )}

      {/* Event Attendee Modal */}
      {showEventAttendeeModal && selectedEventForModal && (
        <EventAttendeeModal
          isOpen={showEventAttendeeModal}
          onClose={() => {
            setShowEventAttendeeModal(false);
            setSelectedEventForModal(null);
          }}
          eventData={{
            id: selectedEventForModal.id,
            title: selectedEventForModal.title,
            eventDate: selectedEventForModal.eventDate,
            location: selectedEventForModal.location,
            isFree: selectedEventForModal.isFree,
            price: selectedEventForModal.price ?? null,
          }}
        />
      )}

      {/* Enhanced Class Cancellation Modal with Alternative Classes */}
      {showCancellationModal && selectedClassForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCancellationModal(false);
              setSelectedClassForModal(null);
              setCancellationReason('');
              setSelectedAlternativeClasses([]);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cancel Class</h2>
                  <p className="text-sm text-gray-600">{selectedClassForModal.name}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-700 mb-3">
                    This will cancel the class and automatically notify all enrolled members ({selectedClassForModal.enrolled} members).
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason *
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="e.g., Instructor unavailable, equipment issues, low enrollment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={3}
                    required
                />
              </div>

              {/* Alternative Classes Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggest Alternative Classes (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select classes to suggest to enrolled members in the cancellation email
                </p>
                <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  {classes
                    .filter(c => 
                      c.id !== selectedClassForModal.id && 
                      c.status === 'Active' &&
                      new Date(c.schedule) > new Date()
                    )
                    .map(cls => (
                      <label 
                        key={cls.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAlternativeClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAlternativeClasses(prev => [...prev, cls.id]);
                            } else {
                              setSelectedAlternativeClasses(prev => prev.filter(id => id !== cls.id));
                            }
                          }}
                          className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                          <p className="text-xs text-gray-600">{cls.instructor} • {new Date(cls.schedule).toLocaleString()}</p>
                        </div>
                      </label>
                    ))}
                  {classes.filter(c => 
                    c.id !== selectedClassForModal.id && 
                    c.status === 'Active' &&
                    new Date(c.schedule) > new Date()
                  ).length === 0 && (
                    <p className="p-3 text-sm text-gray-500 text-center">No alternative classes available</p>
                  )}
                </div>
                {selectedAlternativeClasses.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {selectedAlternativeClasses.length} alternative class{selectedAlternativeClasses.length > 1 ? 'es' : ''} selected
                  </p>
                )}
              </div>
            </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCancellationModal(false);
                    setSelectedClassForModal(null);
                    setCancellationReason('');
                    setSelectedAlternativeClasses([]);
                  }}
                  className="flex-1"
                  disabled={isCancellingClass}
                >
                  Keep Class
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelClass}
                  disabled={isCancellingClass || !cancellationReason.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isCancellingClass ? 'Cancelling...' : 'Cancel Class'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Cancellation Modal with Refunds */}
      {showEventCancelModal && selectedEventForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEventCancelModal(false);
              setSelectedEventForModal(null);
              setEventCancellationReason('');
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cancel Event</h2>
                  <p className="text-sm text-gray-600">{selectedEventForModal.title}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">This action will:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Cancel the event and notify all {selectedEventForModal.registered} registered attendees</li>
                        {!selectedEventForModal.isFree && selectedEventForModal.price && (
                          <li>Process automatic refunds for all paid registrations (GH₵ {selectedEventForModal.price.toFixed(2)} each)</li>
                        )}
                        <li>Update event status to &quot;Cancelled&quot;</li>
                        <li>Send cancellation emails with the reason provided</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Reason *
                  </label>
                  <textarea
                    value={eventCancellationReason}
                    onChange={(e) => setEventCancellationReason(e.target.value)}
                    placeholder="e.g., Venue unavailable, speaker cancelled, low registration, weather conditions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={4}
                    required
                  />
                </div>

                {!selectedEventForModal.isFree && selectedEventForModal.price && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Estimated Total Refunds:</strong> GH₵ {(selectedEventForModal.price * selectedEventForModal.registered).toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Refunds will be processed automatically to attendees&apos; payment methods
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEventCancelModal(false);
                    setSelectedEventForModal(null);
                    setEventCancellationReason('');
                  }}
                  className="flex-1"
                  disabled={isCancellingEvent}
                >
                  Keep Event
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelEvent}
                  disabled={isCancellingEvent || !eventCancellationReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isCancellingEvent ? 'Cancelling...' : 'Cancel Event'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Promotional Email Modal */}
      {showEventPromoModal && selectedEventForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEventPromoModal(false);
              setSelectedEventForModal(null);
              setPromoCustomMessage('');
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Send Promotional Email</h2>
                  <p className="text-sm text-gray-600">{selectedEventForModal.title}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="audience"
                        value="all"
                        checked={promoTargetAudience === 'all'}
                        onChange={(e) => setPromoTargetAudience(e.target.value as 'all' | 'members' | 'new')}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">All Users</p>
                        <p className="text-xs text-gray-600">Send to everyone in the database</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="audience"
                        value="members"
                        checked={promoTargetAudience === 'members'}
                        onChange={(e) => setPromoTargetAudience(e.target.value as 'all' | 'members' | 'new')}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Members Only</p>
                        <p className="text-xs text-gray-600">Target current active members</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="audience"
                        value="new"
                        checked={promoTargetAudience === 'new'}
                        onChange={(e) => setPromoTargetAudience(e.target.value as 'all' | 'members' | 'new')}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">New Users / Prospects</p>
                        <p className="text-xs text-gray-600">Target users who joined in last 30 days</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Message (Optional)
                  </label>
                  <textarea
                    value={promoCustomMessage}
                    onChange={(e) => setPromoCustomMessage(e.target.value)}
                    placeholder="Add a personalized message to include in the promotional email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The email will include event details, date, location, and pricing automatically
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Promotional email will be sent to selected audience with event information
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEventPromoModal(false);
                    setSelectedEventForModal(null);
                    setPromoCustomMessage('');
                  }}
                  className="flex-1"
                  disabled={isSendingPromo}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSendEventPromo}
                  disabled={isSendingPromo}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isSendingPromo ? 'Sending...' : 'Send Promotional Email'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Deadline Modal */}
      {showDeadlineModal && selectedEventForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeadlineModal(false);
              setSelectedEventForModal(null);
              setDeadlineDate('');
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Set Registration Deadline</h2>
                  <p className="text-sm text-gray-600">{selectedEventForModal.title}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-close hours before event
                  </label>
                  <select
                    value={autoCloseHours}
                    onChange={(e) => setAutoCloseHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 hour before</option>
                    <option value={2}>2 hours before</option>
                    <option value={6}>6 hours before</option>
                    <option value={12}>12 hours before</option>
                    <option value={24}>1 day before</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p>⏰ Registration will automatically close at the deadline and notify all registered attendees.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeadlineModal(false);
                    setSelectedEventForModal(null);
                    setDeadlineDate('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSetDeadline}
                  disabled={!deadlineDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Set Deadline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Check-in Modal */}
      {showEventCheckinModal && selectedEventForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEventCheckinModal(false);
              setSelectedEventForModal(null);
              setEventCheckinResult(null);
              setShowEventQRScanner(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-full">
                  <QrCode className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Event Check-in</h2>
                  <p className="text-sm text-gray-600">{selectedEventForModal.title}</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Registered</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {checkinStats?.totalRegistrations || selectedEventForModal.registered}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-green-700">{checkinStats?.checkedIn || 0}</p>
                  {checkinStats && checkinStats.totalRegistrations > 0 && (
                    <p className="text-xs text-green-600">{checkinStats.attendanceRate}% attendance</p>
                  )}
                </div>
              </div>

              {/* Success/Error Message */}
              {eventCheckinResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg mb-6 ${
                    eventCheckinResult.success 
                      ? 'bg-green-50 border-2 border-green-500' 
                      : 'bg-red-50 border-2 border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {eventCheckinResult.success ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${
                        eventCheckinResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {eventCheckinResult.message}
                      </p>
                      {eventCheckinResult.attendee && (
                        <div className="text-sm">
                          <p className="text-gray-700">
                            <span className="font-medium">Name:</span> {eventCheckinResult.attendee.name}
                          </p>
                          <p className="text-gray-700">
                            <span className="font-medium">Email:</span> {eventCheckinResult.attendee.email}
                          </p>
                          {eventCheckinResult.attendee.ticketId && (
                            <p className="text-gray-700">
                              <span className="font-medium">Ticket:</span> {eventCheckinResult.attendee.ticketId}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* QR Scanner */}
              {showEventQRScanner ? (
                <div className="border-2 border-green-500 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Scanning...</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEventQRScanner(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <WebcamQRScanner
                    onScan={handleEventQRScan}
                    onClose={() => setShowEventQRScanner(false)}
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Scanner</h3>
                  <p className="text-gray-600 mb-4">Scan attendee tickets to check them in</p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowEventQRScanner(true)}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Start QR Scanner
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEventCheckinModal(false);
                    setSelectedEventForModal(null);
                    setEventCheckinResult(null);
                    setShowEventQRScanner(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Details Modal */}
      {showAuditLogDetails && selectedAuditLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => {
                    setShowAuditLogDetails(false);
                    setSelectedAuditLog(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedAuditLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Action</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedAuditLog.action.includes('login') ? 'bg-green-100 text-green-700' :
                    selectedAuditLog.action.includes('logout') ? 'bg-gray-100 text-gray-700' :
                    selectedAuditLog.action.includes('created') ? 'bg-blue-100 text-blue-700' :
                    selectedAuditLog.action.includes('updated') ? 'bg-yellow-100 text-yellow-700' :
                    selectedAuditLog.action.includes('deleted') ? 'bg-red-100 text-red-700' :
                    selectedAuditLog.action.includes('payment') ? 'bg-green-100 text-green-700' :
                    selectedAuditLog.action.includes('checkin') || selectedAuditLog.action.includes('checkout') ? 'bg-purple-100 text-purple-700' :
                    selectedAuditLog.action.includes('failed') ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedAuditLog.action.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">User</label>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedAuditLog.userName}</p>
                    <p className="text-xs text-gray-500">{selectedAuditLog.userEmail}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Entity Type</label>
                  <p className="text-sm text-gray-900">{selectedAuditLog.entityType}</p>
                </div>
                {selectedAuditLog.entityId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Entity ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedAuditLog.entityId}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">IP Address</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedAuditLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              {/* Additional Details */}
              {selectedAuditLog.userAgent && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">User Agent</label>
                  <p className="text-sm text-gray-900 break-all">{selectedAuditLog.userAgent}</p>
                </div>
              )}

              {selectedAuditLog.sessionId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Session ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedAuditLog.sessionId}</p>
                </div>
              )}

              {/* Changes */}
              {selectedAuditLog.changes && Object.keys(selectedAuditLog.changes).length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Changes</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedAuditLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedAuditLog.metadata && Object.keys(selectedAuditLog.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Metadata</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => {
                  setShowAuditLogDetails(false);
                  setSelectedAuditLog(null);
                }}
                variant="outline"
              >
                Close
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
