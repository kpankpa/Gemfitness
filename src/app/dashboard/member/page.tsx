'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  QrCode, Activity, LogOut, CreditCard, Flame, Trophy,
  TrendingUp, Clock, Target, Award, CalendarDays, CheckCircle2,
  Zap, Receipt, LayoutDashboard,
  Dumbbell, ShieldCheck, User, Mail, Phone, MapPin, Calendar,
  RefreshCw, Settings, X, Check, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import ParQBanner from '@/components/ParQBanner';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import SubscriptionManagement from '@/components/SubscriptionManagement';
import MemberReceipts from '@/components/MemberReceipts';

// ─── Types ─────────────────────────────────────────────────────────────────

type TabId = 'home' | 'qr' | 'activity' | 'events' | 'more';

type Subscription = {
  id: string;
  userId?: string;
  plan: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED' | 'TRIAL';
  startDate: string;
  endDate: string;
  amount: number;
  registrationType?: string;
};

type CheckIn = {
  id: string;
  date: string;
  time: string;
  method: 'qr' | 'manual';
  checkedBy: string;
  checkInTime: string;
};

type GymClass = {
  id: string;
  name: string;
  instructor: string;
  bookedFor: string;
  time: string;
  duration: string;
  type: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  color: string;
};

type AvailableClass = {
  id: string;
  name: string;
  description: string;
  instructor: string;
  schedule: string;
  time: string;
  duration: string;
  type: string;
  color: string;
  spots: string;
};

type DashboardData = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    qrCode: string;
    registrationPaid: boolean;
    createdAt: string;
    memberSince: string;
  };
  membership: {
    status: 'active' | 'expired' | 'expiring_soon' | 'inactive';
    plan: string;
    expiresAt: string | null;
    daysLeft: number;
    amount: number;
  };
  stats: {
    totalCheckIns: number;
    totalPayments: number;
    thisMonthCheckIns: number;
  };
  recentCheckIns: CheckIn[];
  bookedClasses: GymClass[];
  availableClasses: AvailableClass[];
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

type AuthUserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address?: string | null;
  emergencyContact?: string;
  emergencyPhone?: string;
  fitnessGoals?: string | null;
  qrCode?: string | null;
  parqCompleted?: boolean;
  profileImage?: string | null;
  profileImageGracePeriodEnd?: Date | null;
  subscriptions?: Subscription[];
  checkIns?: Array<{ id: string; checkInTime: Date; checkOutTime: Date | null }>;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  ONE_MONTH:    '1 Month',
  THREE_MONTHS: '3 Months',
  SIX_MONTHS:   '6 Months',
  ONE_YEAR:     '1 Year',
  DAILY:        'Day Pass',
  'ONE MONTH':   '1 Month',
  'THREE MONTHS':'3 Months',
  'ONE YEAR':    '1 Year',
};

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'home',     label: 'Home',     icon: LayoutDashboard },
  { id: 'qr',       label: 'QR Code',  icon: QrCode },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'events',   label: 'Events',   icon: CalendarDays },
  { id: 'more',     label: 'More',     icon: Settings },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function calcStreak(checkIns: CheckIn[]): number {
  if (!checkIns.length) return 0;
  const days = [...new Set(checkIns.map(c => c.date))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let expected = days[0] === today ? today : yesterday;
  for (const day of days) {
    if (day === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

function calcLongestStreak(checkIns: CheckIn[]): number {
  const days = [...new Set(checkIns.map(c => c.date))].sort();
  if (!days.length) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr.getTime() - prev.getTime()) / 864e5;
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-100 rounded-2xl animate-pulse ${className}`} />;
}

function RingProgress({
  pct, size = 80, stroke = 7, color = '#f97316',
}: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function MemberDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const authUser = user as unknown as AuthUserData | null;

  const [tab, setTab] = useState<TabId>('home');
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, eventsRes] = await Promise.all([
        fetch('/api/member/dashboard'),
        fetch('/api/events'),
      ]);
      if (dashRes.ok) setDashData(await dashRes.json());
      if (eventsRes.ok) {
        const e = await eventsRes.json();
        setEvents((e.events as Event[]).filter((ev: Event) => ev.status !== 'COMPLETED'));
      }
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { if (!authLoading) router.push('/login'); return; }
    loadData();
  }, [isAuthenticated, authLoading, router, loadData]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const checkIns = dashData?.recentCheckIns ?? [];
  const allCheckInDates = useMemo(() => checkIns.map(c => c.date), [checkIns]);

  const currentStreak    = useMemo(() => calcStreak(checkIns), [checkIns]);
  const longestStreak    = useMemo(() => calcLongestStreak(checkIns), [checkIns]);
  const totalCheckIns    = dashData?.stats.totalCheckIns ?? 0;
  const thisMonthCheckIns = dashData?.stats.thisMonthCheckIns ?? 0;
  const daysLeft         = dashData?.membership.daysLeft ?? 0;
  const membership       = dashData?.membership;

  const qrCode      = dashData?.user.qrCode ?? (authUser?.qrCode ? `GYM|${authUser.qrCode}` : null);
  const firstName   = dashData?.user.firstName ?? authUser?.firstName ?? '';
  const lastName    = dashData?.user.lastName  ?? authUser?.lastName  ?? '';
  const fullName    = `${firstName} ${lastName}`.trim();
  const initials    = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const profileImage = authUser?.profileImage ?? null;
  const memberSince  = dashData?.user.memberSince
    ? new Date(dashData.user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const activeSub = authUser?.subscriptions?.find(s => s.status === 'ACTIVE');

  const heatmap = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      const count = allCheckInDates.filter(k => k === key).length;
      return { key, count, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    });
  }, [allCheckInDates]);

  const upcomingEvents = events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING');

  const achievements = useMemo(() => [
    { id: 1, emoji: '🏁', title: 'First Visit',       description: 'Checked in for the first time',  unlocked: totalCheckIns >= 1 },
    { id: 2, emoji: '🔥', title: '7-Day Streak',      description: 'Worked out 7 days in a row',     unlocked: longestStreak >= 7 },
    { id: 3, emoji: '👑', title: 'Consistency King',  description: 'Reached a 14-day streak',        unlocked: longestStreak >= 14 },
    { id: 4, emoji: '💯', title: 'Century Club',      description: 'Logged 100 gym visits',          unlocked: totalCheckIns >= 100 },
    { id: 5, emoji: '⚡', title: 'Streak Warrior',    description: 'Maintained a 30-day streak',     unlocked: longestStreak >= 30 },
    { id: 6, emoji: '🌟', title: 'Monthly Regular',   description: '10+ visits this month',          unlocked: thisMonthCheckIns >= 10 },
  ], [totalCheckIns, longestStreak, thisMonthCheckIns]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const MS = {
    active:        { text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  ring: '#22c55e', label: 'Active' },
    expiring_soon: { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  ring: '#f59e0b', label: 'Expiring Soon' },
    expired:       { text: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    ring: '#ef4444', label: 'Expired' },
    inactive:      { text: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200',   ring: '#9ca3af', label: 'No Plan' },
  };
  const msC = MS[membership?.status ?? 'inactive'];

  const planDays: Record<string, number> = {
    ONE_MONTH: 30, 'ONE MONTH': 30,
    THREE_MONTHS: 90, 'THREE MONTHS': 90,
    SIX_MONTHS: 180,
    ONE_YEAR: 365, 'ONE YEAR': 365,
    DAILY: 1,
  };
  const totalDays = planDays[membership?.plan?.toUpperCase().replace(/ /g, '_') ?? ''] ?? 30;
  const ringPct   = (membership?.status === 'active' || membership?.status === 'expiring_soon')
    ? Math.max(0, (daysLeft / totalDays) * 100) : 0;

  const planLabel = (raw?: string) =>
    PLAN_LABELS[raw?.replace(/ /g, '_') ?? ''] ?? raw ?? '—';

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (authLoading || (loading && !dashData)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-64 bg-gradient-to-br from-gray-900 to-gray-700 rounded-b-[32px] p-6 flex flex-col justify-end gap-3">
          <SkeletonCard className="h-5 w-28 bg-gray-700" />
          <SkeletonCard className="h-8 w-44 bg-gray-700" />
          <SkeletonCard className="h-4 w-20 bg-gray-700" />
        </div>
        <div className="p-4 space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="h-20" />)}
          </div>
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ─ TOP APP BAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight">
              Gem<span className="text-orange-500">Fitness</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {refreshing && <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />}
            <button
              title="Refresh"
              onClick={() => loadData(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex-shrink-0 ml-1"
            >
              {profileImage
                ? <Image src={profileImage} alt={fullName} width={32} height={32} className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-200" />
                : <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center ring-2 ring-orange-200"><span className="text-sm font-black text-orange-600">{initials}</span></div>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ─ MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-28">

        {/* Banners */}
        <div className="px-4 pt-3 space-y-2">
          <ProfileCompletionBanner
            hasProfileImage={!!profileImage}
            gracePeriodEnded={
              authUser?.profileImageGracePeriodEnd
                ? new Date() > new Date(authUser.profileImageGracePeriodEnd)
                : false
            }
            daysRemaining={
              authUser?.profileImageGracePeriodEnd
                ? Math.max(0, Math.ceil((new Date(authUser.profileImageGracePeriodEnd).getTime() - Date.now()) / 864e5))
                : 0
            }
            onUploadClick={() => setShowProfileModal(true)}
          />
          <ParQBanner parqCompleted={authUser?.parqCompleted ?? false} firstName={firstName} />

          {/* ── Expiry Warning Banner ──────────────────────────────────────── */}
          {daysLeft > 0 && daysLeft <= 7 && (
            <div className={`flex items-center gap-3 rounded-2xl p-3 border ${
              daysLeft <= 1
                ? 'bg-red-50 border-red-200'
                : daysLeft <= 3
                ? 'bg-orange-50 border-orange-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                daysLeft <= 1 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black ${
                  daysLeft <= 1 ? 'text-red-800' : daysLeft <= 3 ? 'text-orange-800' : 'text-amber-800'
                }`}>
                  {daysLeft === 1
                    ? 'Your membership expires tomorrow!'
                    : `Membership expires in ${daysLeft} days!`}
                </p>
                <p className={`text-xs mt-0.5 ${
                  daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-orange-600' : 'text-amber-600'
                }`}>
                  Renew now to keep your access and maintain your streak.
                </p>
              </div>
              <button
                onClick={() => setTab('more')}
                className={`flex-shrink-0 text-xs font-black px-3 py-2 rounded-xl text-white active:scale-95 transition-transform ${
                  daysLeft <= 1 ? 'bg-red-500' : daysLeft <= 3 ? 'bg-orange-500' : 'bg-amber-500'
                }`}
              >
                Renew
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════ HOME ══════════════════════════════════ */}
        {tab === 'home' && (
          <div>
            {/* HERO CARD */}
            <div className="mx-4 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 shadow-xl">
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1 min-w-0">
                  <p className="text-orange-400 text-[11px] font-black uppercase tracking-[0.15em] mb-1">Welcome back 👋</p>
                  <h1 className="text-2xl font-black text-white leading-tight truncate">{fullName}</h1>
                  <p className="text-gray-500 text-xs mt-1">Member since {memberSince}</p>
                </div>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex-shrink-0 ml-3 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-orange-900/40"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-sm font-bold">Check In</span>
                </button>
              </div>

              {/* Membership status ring */}
              <div className={`rounded-2xl p-4 flex items-center gap-4 ${msC.bg} border ${msC.border}`}>
                <div className="relative flex-shrink-0">
                  <RingProgress pct={ringPct} size={68} stroke={6} color={msC.ring} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-gray-900 leading-none">{daysLeft > 0 ? daysLeft : '—'}</span>
                    <span className="text-[9px] text-gray-500 font-semibold">days</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${msC.bg} ${msC.text} border ${msC.border} mb-1`}>
                    {msC.label}
                  </span>
                  <p className="font-black text-gray-900 text-sm leading-tight">{planLabel(membership?.plan)}</p>
                  {membership?.expiresAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {membership.status === 'expired' ? 'Expired ' : 'Expires '}
                      {new Date(membership.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                  {(membership?.status === 'expired' || membership?.status === 'inactive') && (
                    <button onClick={() => setTab('more')} className="text-[11px] font-black text-orange-600 mt-1 underline underline-offset-2">
                      Renew Now →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* STATS ROW */}
            <div className="px-4 mt-3 grid grid-cols-4 gap-2">
              {([
                { icon: Flame,     val: currentStreak,     label: 'Streak',   unit: 'days',   color: 'text-orange-500', bg: 'bg-orange-50' },
                { icon: Zap,       val: totalCheckIns,     label: 'Total',    unit: 'visits', color: 'text-blue-500',   bg: 'bg-blue-50' },
                { icon: Trophy,    val: longestStreak,     label: 'Best',     unit: 'streak', color: 'text-purple-500', bg: 'bg-purple-50' },
                { icon: Target,    val: thisMonthCheckIns, label: 'Month',    unit: 'visits', color: 'text-green-500',  bg: 'bg-green-50' },
              ] as const).map(({ icon: Icon, val, label, unit, color, bg }) => (
                <button
                  key={label}
                  onClick={() => setTab('activity')}
                  className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-0.5 active:scale-90 transition-transform`}
                >
                  <Icon className={`w-4 h-4 ${color} mb-0.5`} />
                  <span className="text-xl font-black text-gray-900 leading-none">{val}</span>
                  <span className="text-[9px] font-semibold text-gray-400 text-center leading-tight">{label}<br/>{unit}</span>
                </button>
              ))}
            </div>

            {/* WEEK VIEW */}
            <div className="mx-4 mt-3 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900 text-sm">This Week</p>
                <button onClick={() => setTab('activity')} className="text-[11px] font-bold text-orange-500">See activity →</button>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const key = d.toISOString().split('T')[0];
                  const hit = allCheckInDates.includes(key);
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                        hit ? 'bg-orange-500 shadow shadow-orange-200' :
                        isToday ? 'border-2 border-dashed border-orange-300 bg-orange-50' :
                        'bg-gray-100'
                      }`}>
                        {hit && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[9px] font-bold text-gray-400">{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOOKED CLASSES CAROUSEL */}
            {(dashData?.bookedClasses?.length ?? 0) > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className="font-black text-gray-900 text-sm">Booked Classes</p>
                  <button onClick={() => setTab('activity')} className="text-[11px] font-bold text-orange-500">See all →</button>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                  {dashData!.bookedClasses.map(cls => (
                    <div key={cls.id} className={`flex-shrink-0 w-52 rounded-3xl p-4 bg-gradient-to-br ${cls.color || 'from-orange-500 to-amber-500'} text-white shadow-lg`}>
                      <p className="font-black text-sm mb-0.5 truncate">{cls.name}</p>
                      <p className="text-xs text-white/70 mb-4 truncate">{cls.instructor}</p>
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>{cls.time}</span>
                        <span className="bg-black/20 px-2 py-0.5 rounded-full">{cls.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            <div className="mx-4 mt-3 bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="font-black text-gray-900 text-sm">Achievements</p>
                <span className="text-[10px] bg-orange-50 border border-orange-100 text-orange-600 font-black px-2.5 py-0.5 rounded-full">
                  {unlockedCount}/{achievements.length}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {achievements.map(a => (
                  <div key={a.id} title={a.title} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${a.unlocked ? 'bg-amber-50' : 'bg-gray-50 opacity-40'}`}>
                    <span className="text-xl">{a.emoji}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setTab('activity')} className="mt-3 w-full text-center text-[11px] font-bold text-orange-500">
                View all achievements →
              </button>
            </div>

            {/* EVENTS CAROUSEL */}
            {upcomingEvents.length > 0 && (
              <div className="mt-4 mb-2">
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className="font-black text-gray-900 text-sm">Upcoming Events</p>
                  <button onClick={() => setTab('events')} className="text-[11px] font-bold text-orange-500">See all →</button>
                </div>
                <div className="flex gap-3 px-4 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                  {upcomingEvents.slice(0, 6).map(ev => {
                    const d = new Date(ev.eventDate);
                    return (
                      <button key={ev.id} onClick={() => setTab('events')} className="flex-shrink-0 w-44 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform text-left">
                        <div className="h-16 bg-gradient-to-br from-gray-900 to-gray-600 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-white leading-none">{d.getDate()}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-900 text-xs truncate">{ev.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{ev.location}</p>
                          <p className={`mt-1 text-[10px] font-black ${ev.isFree ? 'text-green-600' : 'text-orange-600'}`}>
                            {ev.isFree ? 'FREE' : `GHS ${ev.price?.toFixed(2)}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ QR CODE ═══════════════════════════════ */}
        {tab === 'qr' && (
          <div className="px-4 pt-4 space-y-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">My QR Code</h2>
              <p className="text-sm text-gray-400 mt-0.5">Show this at reception to check in</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              {qrCode ? (
                <>
                  <div className="flex flex-col items-center mb-5">
                    {profileImage
                      ? <Image src={profileImage} alt={fullName} width={72} height={72} className="w-18 h-18 rounded-full object-cover ring-4 ring-orange-100 mb-3" />
                      : <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center ring-4 ring-orange-50 mb-3"><span className="text-2xl font-black text-orange-600">{initials}</span></div>
                    }
                    <p className="text-lg font-black text-gray-900">{fullName}</p>
                    {membership?.status === 'active' && (
                      <span className="mt-1.5 inline-flex items-center gap-1 px-3 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {planLabel(membership.plan)} · Active
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 inline-block">
                    <QRCodeDisplay data={qrCode} size={220} showDownload label={qrCode} />
                  </div>
                  <p className="mt-4 text-xs text-gray-400">Scan at the reception desk to log your visit</p>
                </>
              ) : (
                <div className="py-12">
                  <QrCode className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-bold">QR code not available</p>
                  <p className="text-xs text-gray-400 mt-1">Contact reception to get your code</p>
                </div>
              )}
            </div>

            {/* Digital membership card */}
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg,#111827 0%,#1f2937 60%,#374151 100%)' }}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow"><Dumbbell className="w-4 h-4 text-white" /></div>
                    <span className="text-xs font-black text-gray-400 tracking-widest uppercase">GemFitness</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-xl font-black text-white mb-0.5">{fullName}</p>
                <p className="text-xs text-gray-500 mb-5">{dashData?.user.email ?? authUser?.email}</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  {[
                    { label: 'Member Since', value: memberSince },
                    { label: 'Total Visits',  value: String(totalCheckIns) },
                    { label: 'Current Streak', value: `${currentStreak} days` },
                    { label: 'Plan', value: planLabel(membership?.plan) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-gray-600 leading-none mb-0.5 uppercase tracking-wide text-[9px]">{label}</p>
                      <p className="font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`h-1.5 w-full ${msC.ring === '#22c55e' ? 'bg-green-500' : msC.ring === '#f59e0b' ? 'bg-amber-500' : msC.ring === '#ef4444' ? 'bg-red-500' : 'bg-gray-600'}`} />
            </div>
          </div>
        )}

        {/* ══════════════════════════ ACTIVITY ══════════════════════════════ */}
        {tab === 'activity' && (
          <div className="px-4 pt-4 space-y-4">
            <h2 className="text-xl font-black text-gray-900">Activity</h2>

            {/* Gradient stat cards */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { icon: Flame,      val: currentStreak,     label: 'Current Streak',  sub: 'days',   grad: 'from-orange-500 to-amber-500',   shadow: 'shadow-orange-100' },
                { icon: Trophy,     val: longestStreak,     label: 'Longest Streak',  sub: 'days',   grad: 'from-purple-500 to-violet-600',  shadow: 'shadow-purple-100' },
                { icon: Zap,        val: totalCheckIns,     label: 'Total Visits',    sub: 'visits', grad: 'from-blue-500 to-cyan-500',      shadow: 'shadow-blue-100' },
                { icon: TrendingUp, val: thisMonthCheckIns, label: 'This Month',      sub: 'visits', grad: 'from-green-500 to-emerald-500',  shadow: 'shadow-green-100' },
              ] as const).map(({ icon: Icon, val, label, sub, grad, shadow }) => (
                <div key={label} className={`bg-gradient-to-br ${grad} rounded-3xl p-4 text-white shadow-lg ${shadow}`}>
                  <Icon className="w-5 h-5 mb-2 opacity-80" />
                  <p className="text-3xl font-black leading-none">{val}</p>
                  <p className="text-xs opacity-60 mt-0.5">{sub}</p>
                  <p className="text-xs font-bold mt-2 opacity-90">{label}</p>
                </div>
              ))}
            </div>

            {/* 30-day heatmap */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="font-black text-gray-900 mb-4">30-Day Attendance</p>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                {heatmap.map(({ key, count, label: dayLabel }) => (
                  <div
                    key={key}
                    title={`${dayLabel}: ${count} visit${count !== 1 ? 's' : ''}`}
                    className={`aspect-square rounded-lg cursor-default transition-transform hover:scale-110 ${
                      count === 0 ? 'bg-gray-100' :
                      count === 1 ? 'bg-orange-200' :
                      count === 2 ? 'bg-orange-400' : 'bg-orange-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                <span>Less</span>
                {['bg-gray-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-600'].map(c => (
                  <div key={c} className={`w-3.5 h-3.5 rounded ${c}`} />
                ))}
                <span>More</span>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="font-black text-gray-900">Achievements</p>
                <span className="text-xs bg-orange-50 text-orange-600 font-black px-2.5 py-1 rounded-full border border-orange-100">
                  {unlockedCount} / {achievements.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map(a => (
                  <div key={a.id} className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    a.unlocked ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 opacity-40'
                  }`}>
                    <span className="text-2xl block mb-1.5">{a.emoji}</span>
                    <p className="text-[11px] font-black text-gray-800 leading-tight">{a.title}</p>
                    {a.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto mt-1.5" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="font-black text-gray-900 mb-4">Recent Check-ins</p>
              {checkIns.length > 0 ? (
                <div className="space-y-2">
                  {checkIns.map(ci => (
                    <div key={ci.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-100 transition-colors">
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {new Date(ci.checkInTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{ci.time} · {ci.method === 'qr' ? 'QR Code' : 'Manual'}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="font-bold text-gray-500 text-sm">No check-ins yet</p>
                  <p className="text-xs text-gray-400 mt-1">Scan your QR code at reception to get started</p>
                </div>
              )}
            </div>

            {/* Booked Classes */}
            {(dashData?.bookedClasses?.length ?? 0) > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <p className="font-black text-gray-900 mb-4">Booked Classes</p>
                <div className="space-y-2">
                  {dashData!.bookedClasses.map(cls => (
                    <div key={cls.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className={`w-10 h-10 bg-gradient-to-br ${cls.color || 'from-orange-400 to-orange-600'} rounded-xl flex items-center justify-center flex-shrink-0 shadow`}>
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{cls.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cls.time} · {cls.instructor}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cls.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        cls.status === 'attended'  ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{cls.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Classes */}
            {(dashData?.availableClasses?.length ?? 0) > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <p className="font-black text-gray-900 mb-4">Available Classes</p>
                <div className="space-y-2">
                  {dashData!.availableClasses.map(cls => (
                    <div key={cls.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-100 transition-colors">
                      <div className={`w-10 h-10 bg-gradient-to-br ${cls.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow`}>
                        <Dumbbell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{cls.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cls.time} · {cls.instructor}</p>
                      </div>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">{cls.spots}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ EVENTS ═══════════════════════════════ */}
        {tab === 'events' && (
          <div className="px-4 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900">Events</h2>
              <span className="text-xs text-gray-400 font-semibold">{upcomingEvents.length} upcoming</span>
            </div>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(ev => {
                  const d = new Date(ev.eventDate);
                  const spotsLeft = ev.maxAttendees ? ev.maxAttendees - ev.registered : null;
                  const statusStyle: Record<string, string> = {
                    UPCOMING: 'bg-blue-100 text-blue-700',
                    ONGOING:  'bg-green-100 text-green-700',
                    CANCELLED:'bg-red-100 text-red-700',
                    COMPLETED:'bg-gray-100 text-gray-600',
                  };
                  return (
                    <div key={ev.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                      <div className="flex">
                        <div className="w-20 bg-gradient-to-b from-gray-900 to-gray-700 flex flex-col items-center justify-center py-5 flex-shrink-0">
                          <span className="text-3xl font-black text-white leading-none">{d.getDate()}</span>
                          <span className="text-xs text-gray-400 uppercase mt-0.5">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">{d.getFullYear()}</span>
                        </div>
                        <div className="p-4 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`font-black text-gray-900 leading-tight flex-1 text-sm ${ev.status === 'CANCELLED' ? 'line-through text-gray-400' : ''}`}>
                              {ev.title}
                            </p>
                            <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${statusStyle[ev.status]}`}>
                              {ev.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ev.description}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400 mb-2">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            {spotsLeft !== null && <span className="flex items-center gap-1"><User className="w-3 h-3" />{spotsLeft} spots</span>}
                          </div>
                          <span className={`text-sm font-black ${ev.isFree ? 'text-green-600' : 'text-orange-600'}`}>
                            {ev.isFree ? 'FREE' : `GHS ${ev.price?.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <CalendarDays className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="font-black text-gray-700">No upcoming events</p>
                <p className="text-sm text-gray-400 mt-1">Check back soon</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════ MORE ════════════════════════════════ */}
        {tab === 'more' && (
          <div className="px-4 pt-4 space-y-4">
            {/* Profile hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
              <button onClick={() => setShowProfileModal(true)} className="flex-shrink-0">
                {profileImage
                  ? <Image src={profileImage} alt={fullName} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-orange-400" />
                  : <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center ring-2 ring-orange-400 shadow"><span className="text-2xl font-black text-white">{initials}</span></div>
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-lg leading-tight truncate">{fullName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{dashData?.user.email ?? authUser?.email}</p>
                <button onClick={() => setShowProfileModal(true)} className="mt-1.5 text-[11px] font-bold text-orange-400">Edit Photo →</button>
              </div>
            </div>

            {/* Membership management */}
            <div className={`bg-white rounded-3xl p-5 shadow-sm border ${msC.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <p className="font-black text-gray-900">Membership</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${msC.bg} ${msC.text} border ${msC.border}`}>{msC.label}</span>
              </div>
              {activeSub ? (
                <SubscriptionManagement
                  subscription={activeSub as import('@/types').Subscription}
                  onUpdate={() => loadData(true)}
                />
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-black text-gray-700 mb-1">No Active Plan</p>
                  <p className="text-xs text-gray-400 mb-4">Subscribe to access all facilities</p>
                  <button className="w-full bg-orange-500 text-white font-black py-3 rounded-2xl text-sm shadow-lg shadow-orange-100 active:scale-95 transition-transform">
                    View Plans &amp; Subscribe
                  </button>
                </div>
              )}
            </div>

            {/* Receipts */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4 text-orange-500" />
                <p className="font-black text-gray-900">Payment History</p>
              </div>
              <MemberReceipts />
            </div>

            {/* Personal info */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <p className="font-black text-gray-900 mb-4">Personal Info</p>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: Mail,     label: 'Email',   val: dashData?.user.email ?? authUser?.email ?? '—' },
                  { icon: Phone,    label: 'Phone',   val: dashData?.user.phone ?? authUser?.phone ?? '—' },
                  { icon: Calendar, label: 'D.O.B',   val: authUser?.dateOfBirth ? new Date(authUser.dateOfBirth).toLocaleDateString() : '—' },
                  { icon: MapPin,   label: 'Address', val: authUser?.address ?? '—' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health & Goals */}
            {(authUser?.parqCompleted !== undefined || authUser?.fitnessGoals) && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <p className="font-black text-gray-900 mb-4">Health &amp; Goals</p>
                <div className={`flex items-center gap-3 p-3 rounded-2xl mb-3 ${authUser?.parqCompleted ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <Award className={`w-5 h-5 flex-shrink-0 ${authUser?.parqCompleted ? 'text-green-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`text-sm font-black ${authUser?.parqCompleted ? 'text-green-700' : 'text-amber-700'}`}>PAR-Q Health Screening</p>
                    <p className={`text-xs ${authUser?.parqCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                      {authUser?.parqCompleted ? 'Completed ✓' : 'Pending — please complete'}
                    </p>
                  </div>
                </div>
                {authUser?.fitnessGoals && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-orange-500" /><p className="text-sm font-black text-gray-900">Fitness Goals</p></div>
                    <p className="text-sm text-gray-600 bg-orange-50 rounded-2xl p-3 border border-orange-100">{authUser.fitnessGoals}</p>
                  </div>
                )}
              </div>
            )}

            {/* Emergency contact */}
            {authUser?.emergencyContact && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3"><Phone className="w-4 h-4 text-red-500" /><p className="font-black text-gray-900">Emergency Contact</p></div>
                <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                  <p className="text-sm font-bold text-gray-800">{authUser.emergencyContact}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{authUser.emergencyPhone}</p>
                </div>
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 text-red-600 font-black rounded-3xl bg-red-50 border border-red-100 active:scale-95 transition-transform mb-4"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </main>

      {/* ─ BOTTOM NAV ──────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center pt-3 pb-4 gap-0.5 active:scale-90 transition-all ${tab === id ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${tab === id ? 'bg-orange-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold leading-none ${tab === id ? 'text-orange-500' : 'text-gray-400'}`}>
                {label.split(' ')[0]}
              </span>
              {tab === id && <span className="w-1 h-1 bg-orange-500 rounded-full" />}
            </button>
          ))}
        </div>
      </nav>

      {/* ─ QR CHECK-IN MODAL ───────────────────────────────────────────────── */}
      {showQRModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowQRModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" />
          <div
            className="relative bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 text-center shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <p className="font-black text-gray-900 text-lg mb-1">Scan to Check In</p>
            <p className="text-xs text-gray-400 mb-5">Show at the reception desk</p>
            {qrCode ? (
              <div className="bg-gray-50 rounded-2xl p-4 inline-block mb-4">
                <QRCodeDisplay data={qrCode} size={200} showDownload={false} label={qrCode} />
              </div>
            ) : (
              <div className="py-8">
                <QrCode className="w-16 h-16 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">QR not available — contact reception</p>
              </div>
            )}
            <p className="text-sm font-black text-gray-900">{fullName}</p>
            {membership?.status === 'active' && (
              <p className="text-xs text-green-600 font-bold mt-0.5 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                {planLabel(membership.plan)} · Active
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─ PROFILE PHOTO MODAL ─────────────────────────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowProfileModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" />
          <div
            className="relative bg-white w-full sm:max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <h2 className="text-lg font-black text-gray-900 mb-4">Profile Picture</h2>
            <ProfilePictureUpload
              currentImage={profileImage}
              onUploadSuccess={() => { setShowProfileModal(false); loadData(true); }}
            />
          </div>
        </div>
      )}

      {/* ─ LOGOUT CONFIRM ──────────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" />
          <div
            className="relative bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Sign Out?</h3>
            <p className="text-sm text-gray-400 mb-6">You&apos;ll need to sign back in to access your dashboard.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm active:scale-95 transition-transform">
                Cancel
              </button>
              <button onClick={logout} className="py-3 rounded-2xl bg-red-500 text-white font-black text-sm shadow-lg shadow-red-100 active:scale-95 transition-transform">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
