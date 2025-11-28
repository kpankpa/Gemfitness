// Types for the gym management system

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MEMBER' | 'RECEPTIONIST' | 'MANAGER' | 'ADMIN';
  qrCode?: string;
  registrationPaid: boolean;
  registrationType: 'SINGLE' | 'COUPLE' | 'FAMILY';
  createdAt: string;
  memberSince?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'DAILY' | 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  expiresAt: string;
  startDate: string;
}

export interface CheckIn {
  id: string;
  member: string;
  memberId: string;
  time: string;
  method: 'qr' | 'manual';
  checkedBy: string;
  date?: string;
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
  registrationType: 'SINGLE' | 'COUPLE' | 'FAMILY';
  totalCheckIns: number;
  totalPayments: number;
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

export interface NewMember {
  name: string;
  email: string;
  phone: string;
  password: string;
  registrationType: 'SINGLE' | 'COUPLE' | 'FAMILY';
  plan: string;
}

export interface CheckInData {
  qrCode: string;
  memberId: string;
  method: 'qr' | 'manual';
}