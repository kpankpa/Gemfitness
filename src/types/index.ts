// Types for the gym management system

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; 
  email: string;
  phone: string;
  role: 'MEMBER' | 'RECEPTIONIST' | 'MANAGER' | 'ADMIN';
  qrCode?: string;
  registrationPaid: boolean;
  registrationType: 'SELF' | 'WALK_IN' | 'ADMIN';
  createdAt: string;
  memberSince?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' | 'TRIAL';
  amount: number;
  endDate: string;
  startDate: string;
  registrationType: 'SELF' | 'WALK_IN' | 'ADMIN';
  renewalStatus?: string;
  renewalAttemptsCount?: number;
  maxRenewalAttempts?: number;
  lastRenewalFailureReason?: string;
  pausedAt?: string;
  resumeDate?: string;
  paymentMethodId?: string;
  previousPlan?: string;
  planChangeReason?: string;
  lastPlanChangeAt?: string;
  nextRenewalDate?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CheckIn {
  id: string;
  member: string;
  memberId: string;
  time: string;
  method: 'qr' | 'manual';
  checkedBy: string;
  date?: string;
  checkInTime: Date | string; // Full timestamp for filtering
  profileImage?: string | null;
  email?: string;
  phone?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'inactive';
  expiresAt: string | null;
  joinDate: string;
  qrCode?: string;
  registrationPaid: boolean;
  registrationType: 'SELF' | 'WALK_IN' | 'ADMIN';
  totalCheckIns: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  fitnessGoals?: string;
  medicalConditions?: string;
  profileImage?: string | null;
  parqCompleted?: boolean;
  parqCompletedAt?: Date | string | null;
  parqRiskLevel?: 'low' | 'medium' | 'high' | null;
}

export interface Payment {
  id: string;
  member: string;
  amount: number;
  plan: string;
  date: string;
  reference: string;
}

export interface Analytics {
  totalMembers: number;
  activeMembers: number;
  expiringSoon: number;
  todayCheckIns: number;
  monthlyRevenue: number;
  lastMonthRevenue?: number;
  monthlyTransactions?: number;
  recentPayments: Array<{
    id: string;
    member: string;
    amount: number;
    date: string;
  }>;
  attendanceRate?: string;
  revenueGrowth?: number;
  retentionRate?: number;
  avgCheckInsPerDay?: number;
  peakCheckIns?: number;
  weeklyCheckIns?: Array<{ day: string; count: number }>;
}

// Legacy analytics with nested stats (for backward compatibility)
export interface AnalyticsWithStats {
  stats: {
    totalMembers: number;
    activeMembers: number;
    expiringSoon: number;
    todayCheckIns: number;
    monthlyRevenue: number;
  };
  recentPayments: Payment[];
}

export interface BookedClass {
  id: string;
  name: string;
  className?: string;
  instructor: string;
  bookedFor: string;
  time: string;
  duration: string;
  type: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  color: string;
}

export interface AvailableClass {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  schedule: string;
  time: string;
  duration: string;
  type: string;
  color: string;
  spots: string;
}

export interface MembershipInfo {
  status: 'active' | 'expired' | 'expiring_soon' | 'inactive';
  plan: string;
  expiresAt: string | null;
  daysLeft: number;
  amount: number;
}

export interface MemberStats {
  totalCheckIns: number;
  totalPayments: number;
  thisMonthCheckIns: number;
}

export interface DashboardData {
  user: User;
  membership: MembershipInfo;
  stats: MemberStats;
  recentCheckIns: CheckIn[];
  bookedClasses: BookedClass[];
  availableClasses: AvailableClass[];
}

// ============================================
// Event Types
// ============================================

export interface GymEvent {
  id: string;
  title: string;
  name?: string; // Alias for title
  description: string;
  type?: string;
  category?: string;
  eventDate: string;
  date?: string; // Alias for eventDate
  startTime?: string;
  endTime?: string;
  location: string;
  maxParticipants?: number;
  maxAttendees?: number; // Alias for maxParticipants
  registered?: number;
  registeredCount?: number; // Alias for registered
  isFree?: boolean;
  isPaid?: boolean;
  price?: number | null;
  status: string;
  imageUrl?: string;
  organizer?: string;
}

// For admin calendar view
export interface CalendarEvent extends GymEvent {
  registered: number;
  maxAttendees: number;
  isFree: boolean;
}

// For public events page
export interface PublicEvent extends GymEvent {
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  isPaid: boolean;
}

// Advanced features types

export interface EventTicket {
  id: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  qrCode: string;
  securityHash: string;
  checkedIn: boolean;
  checkInTime: string | null;
  createdAt: string;
}

export interface EventCheckIn {
  id: string;
  eventId: string;
  ticketId: string;
  userId: string;
  checkInTime: string;
  method: 'qr' | 'manual';
  staffId: string;
}

export interface PaystackPaymentData {
  amount: number;
  email: string;
  reference: string;
  metadata: {
    eventId: string;
    eventTitle: string;
    userId?: string;
    ticketType?: string;
  };
}

export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
    };
    metadata: Record<string, unknown>;
  };
}

export interface EventRegistrationDeadline {
  eventId: string;
  deadline: string;
  autoClose: boolean;
  reminderSent: boolean;
}

export interface ClassCancellationData {
  classId: string;
  reason: string;
  notifyMembers: boolean;
  alternativeClasses?: string[];
}

export interface EventAnalytics {
  totalRegistrations: number;
  totalTickets: number;
  checkedInCount: number;
  revenue: number;
  attendanceRate: number;
  lastUpdate: string;
}

export interface ClassAnalytics {
  totalEnrollments: number;
  averageRating: number;
  waitlistCount: number;
  totalRevenue: number;
  attendanceRate: number;
  lastUpdate: string;
}

// PAR-Q (Physical Activity Readiness Questionnaire) Types
export interface ParQBasicResponse {
  hasHeartCondition: boolean;
  hasChestPain: boolean;
  hasDizziness: boolean;
  hasJointProblems: boolean;
  takesMedication: boolean;
  hasOtherConditions: boolean;
  otherConditionsDetails?: string;
  needsFollowUp: boolean;
}

export interface ParQFullResponse {
  // General Questions (Page 1)
  heartCondition: boolean;
  chestPain: boolean;
  chestPainRest: boolean;
  lossOfBalance: boolean;
  boneJoint: boolean;
  medication: boolean;
  otherReason: boolean;
  otherReasonDetails?: string;
  
  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
  userId: string;
  
  // Follow-up Questions (Optional for future expansion)
  followUpQuestions?: Record<string, boolean>;
}

export interface ParQSubmission {
  responses: Record<string, boolean>;
  otherReasonDetails?: string;
  riskLevel: 'low' | 'medium' | 'high';
  completedAt: string;
}

export interface PaymentMetadata {
  userId: string;
  email: string;
  plan: 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR';
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  fitnessGoals: string;
  medicalConditions: string;
  parq_basic?: ParQBasicResponse;
}

// ============================================
// Plan & Membership Types
// ============================================

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  isHighlight?: boolean;
  valueProposition?: string;
}

export interface FeatureCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface CategorizedFeature {
  categoryId: string;
  features: PlanFeature[];
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  durationUnit: string;
  isPopular: boolean;
  isFeatured: boolean;
  features: string[];
  categorizedFeatures?: CategorizedFeature[];
  valuePropositions: string[];
  savings?: number;
  comparisonText?: string;
  memberCount?: number;
  targetAudience?: string;
}

export interface AdminPlan extends Plan {
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  activeMembers: number;
  totalRevenue: number;
  displayOrder: number;
  createdAt: string;
}

export interface GymStats {
  totalActiveMembers: number;
  monthlyCheckIns: number;
  planVariety: number;
  establishedYear: number;
  totalClasses: number;
  certifiedTrainers: number;
}

export interface SuccessStory {
  name: string;
  achievement: string;
  plan: string;
  quote: string;
}

export interface FeaturedBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface PlanAnalytics {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalActiveSubscriptions: number;
  newSubscriptionsLast7Days: number;
  newSubscriptionsLast30Days: number;
  expiringInNext30Days: number;
  churnRate: number;
  topPerformingPlan: string;
  planMetrics?: Array<{
    plan: string;
    newSubscriptions7Days: number;
    newSubscriptions30Days: number;
    expiringSoon: number;
    renewalRate: number;
  }>;
}
