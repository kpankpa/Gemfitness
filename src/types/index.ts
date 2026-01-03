// Types for the gym management system

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed field
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
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  endDate: string;
  startDate: string;
  registrationType: 'SELF' | 'WALK_IN' | 'ADMIN';
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
    metadata: any;
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