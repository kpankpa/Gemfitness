'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Ticket,
  Search,
  Download,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Ban,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
  X,
  Settings,
  Save,
  Edit,
  History as HistoryIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/* ────────────────────────── Types ────────────────────────── */

interface DayPass {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: 'active' | 'expired';
  startDate: string;
  endDate: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  reference: string;
  transactionId: string;
  paidAt: string;
}

interface DayPassStats {
  today: { count: number; revenue: number };
  week: { count: number; revenue: number };
  month: { count: number; revenue: number };
  totalAllTime: number;
  activeNow: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DayPassManagerProps {
  onSellDayPass: () => void;
  onUpgrade?: (userId: string) => void;
  isManager?: boolean;
  refreshTrigger?: number; // Increment this to trigger a refresh
}

/* ────────────────────────── Component ────────────────────────── */

export default function DayPassManager({ onSellDayPass, onUpgrade, isManager = false, refreshTrigger }: DayPassManagerProps) {
  // Data state
  const [dayPasses, setDayPasses] = useState<DayPass[]>([]);
  const [stats, setStats] = useState<DayPassStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visitorUsage, setVisitorUsage] = useState<Map<string, {
    totalPasses: number;
    last30DaysPasses: number;
    shouldSuggestMembership: boolean;
  }>>(new Map());

  // Price management state (managers only)
  const [currentPrice, setCurrentPrice] = useState<number>(30);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'momo'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Details modal
  const [selectedPass, setSelectedPass] = useState<DayPass | null>(null);

  // Void confirmation
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Toast helper via parent — we'll display inline messages
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Helper to format date in local timezone
  const formatLocalDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch visitor usage history
  const fetchVisitorUsage = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/day-pass/history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        return data.usage;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Fetch day passes
  const fetchDayPasses = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (paymentFilter !== 'all') params.set('payment', paymentFilter);
    if (searchDebounce) params.set('search', searchDebounce);

    // Date filters - use local date formatting
    if (dateFilter === 'today') {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      params.set('date', dateStr);
      console.log('📅 Fetching day passes for today:', dateStr);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date();
      params.set('startDate', formatLocalDate(weekAgo));
      params.set('endDate', formatLocalDate(today));
    } else if (dateFilter === 'month') {
      const monthStart = new Date();
      monthStart.setDate(1);
      const today = new Date();
      params.set('startDate', formatLocalDate(monthStart));
      params.set('endDate', formatLocalDate(today));
    } else if (dateFilter === 'custom') {
      if (customStartDate) params.set('startDate', customStartDate);
      if (customEndDate) params.set('endDate', customEndDate);
    }

    try {
      const url = `/api/day-pass/list?${params.toString()}`;
      console.log('🔄 Fetching day passes:', url);
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Please log in.');
        } else {
          setError('Failed to load day passes.');
        }
        return;
      }

      const data = await res.json();
      console.log('✅ Day passes fetched:', {
        count: data.dayPasses?.length || 0,
        stats: data.stats,
        pagination: data.pagination
      });
      setDayPasses(data.dayPasses || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      
      // Fetch usage for each unique visitor
      const usageMap = new Map();
      const uniqueUserIds = [...new Set(data.dayPasses.map((dp: DayPass) => dp.userId))] as string[];
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const usage = await fetchVisitorUsage(userId);
          if (usage) {
            usageMap.set(userId, usage);
          }
        })
      );
      setVisitorUsage(usageMap);
    } catch (err) {
      console.error('❌ Failed to fetch day passes:', err);
      setError('Failed to load day passes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, searchDebounce, dateFilter, customStartDate, customEndDate, fetchVisitorUsage, formatLocalDate]);

  // Fetch day pass price
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/day-pass');
      if (res.ok) {
        const data = await res.json();
        if (data.price) setCurrentPrice(data.price);
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch on mount
  useEffect(() => {
    console.log('🚀 DayPassManager mounted, fetching initial data...');
    fetchDayPasses(1);
    fetchPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    console.log('🔄 Filters changed, refetching...', { statusFilter, paymentFilter, dateFilter });
    fetchDayPasses(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter, searchDebounce, dateFilter, customStartDate, customEndDate]);

  // Refetch when refresh trigger changes (e.g., after selling a day pass)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 Refresh triggered from parent, refetching...');
      fetchDayPasses(pagination.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Update day pass price
  const handleSavePrice = async () => {
    const newPrice = parseFloat(priceInput);
    if (isNaN(newPrice) || newPrice <= 0) {
      setToast({ message: 'Please enter a valid price', type: 'error' });
      return;
    }

    setIsSavingPrice(true);
    try {
      const res = await fetch('/api/day-pass', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentPrice(newPrice);
        setEditingPrice(false);
        setToast({ message: `Day pass price updated to GH₵ ${newPrice}`, type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed to update price', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to update price', type: 'error' });
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Void a day pass
  const handleVoidDayPass = async (subscriptionId: string) => {
    setIsVoiding(true);
    try {
      const res = await fetch('/api/day-pass/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action: 'void' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ message: data.message || 'Day pass voided', type: 'success' });
        setVoidingId(null);
        fetchDayPasses(pagination.page);
      } else {
        setToast({ message: data.error || 'Failed to void day pass', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to void day pass', type: 'error' });
    } finally {
      setIsVoiding(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (dayPasses.length === 0) {
      setToast({ message: 'No data to export', type: 'info' });
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Status', 'Amount', 'Payment Method', 'Reference', 'Date', 'Expires', 'Emergency Contact', 'Emergency Phone'];
    const rows = dayPasses.map((dp) => [
      `${dp.firstName} ${dp.lastName}`,
      dp.phone,
      dp.email,
      dp.status,
      dp.amount.toString(),
      dp.paymentMethod,
      dp.reference,
      new Date(dp.startDate).toLocaleString(),
      new Date(dp.endDate).toLocaleString(),
      dp.emergencyContact,
      dp.emergencyPhone,
    ].map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `day-passes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Day passes exported', type: 'success' });
  };

  // Print day pass receipt
  const printReceipt = (dp: DayPass) => {
    const receiptWindow = window.open('', '_blank', 'width=350,height=600,menubar=no,toolbar=no');
    if (!receiptWindow) return;

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Day Pass Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; padding: 20px; font-size: 12px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .bold { font-weight: bold; }
        .big { font-size: 16px; }
        @media print { body { width: 72mm; margin: 0; padding: 5mm; } }
      </style></head><body>
      <div class="center bold big">GemFitness</div>
      <div class="center">Tema, Ghana</div>
      <div class="center" style="margin-top:4px;font-size:14px;font-weight:bold;">DAY PASS</div>
      <div class="line"></div>
      <div class="row"><span>Name:</span><span class="bold">${dp.firstName} ${dp.lastName}</span></div>
      <div class="row"><span>Phone:</span><span>${dp.phone}</span></div>
      <div class="row"><span>Date:</span><span>${new Date(dp.startDate).toLocaleDateString()}</span></div>
      <div class="row"><span>Expires:</span><span>${new Date(dp.endDate).toLocaleTimeString()}</span></div>
      <div class="line"></div>
      <div class="row"><span>Amount:</span><span class="bold big">GH₵ ${dp.amount}</span></div>
      <div class="row"><span>Payment:</span><span>${dp.paymentMethod.toUpperCase()}</span></div>
      <div class="row"><span>Reference:</span><span style="font-size:10px;">${dp.reference}</span></div>
      <div class="row"><span>Status:</span><span class="bold">${dp.paymentStatus.toUpperCase()}</span></div>
      <div class="line"></div>
      <div class="row"><span>Emergency:</span><span>${dp.emergencyContact}</span></div>
      <div class="row"><span>Em. Phone:</span><span>${dp.emergencyPhone}</span></div>
      <div class="line"></div>
      <div class="center" style="margin-top:8px;font-size:10px;">Thank you for visiting GemFitness!</div>
      <div class="center" style="font-size:10px;">Valid for today only</div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `);
    receiptWindow.document.close();
  };

  // Helpers
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('cash')) return { label: 'Cash', color: 'bg-green-100 text-green-700' };
    if (m.includes('momo')) return { label: 'MoMo', color: 'bg-yellow-100 text-yellow-700' };
    return { label: method, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-right ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
           toast.type === 'error' ? <XCircle className="h-4 w-4" /> :
           <AlertTriangle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-60">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.today.count}</p>
                  <p className="text-xs text-gray-500">Today&apos;s Passes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">GH₵ {stats.today.revenue}</p>
                  <p className="text-xs text-gray-500">Today&apos;s Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.month.count}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">GH₵ {stats.month.revenue}</p>
                  <p className="text-xs text-gray-500">Month Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeNow}</p>
                  <p className="text-xs text-gray-500">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price Settings (Managers Only) */}
      {isManager && (
        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-600" />
                  Day Pass Pricing
                </CardTitle>
                <CardDescription>Set the price for walk-in day passes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {editingPrice ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">GH₵</span>
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      min="1"
                      step="0.5"
                      className="w-32 pl-12 pr-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-bold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePrice();
                        if (e.key === 'Escape') setEditingPrice(false);
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSavingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    {isSavingPrice ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingPrice(false)}
                    disabled={isSavingPrice}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                    <span className="text-sm text-orange-600">Current Price</span>
                    <p className="text-2xl font-bold text-orange-700">GH₵ {currentPrice}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setPriceInput(currentPrice.toString()); setEditingPrice(true); }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Change Price
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls Card */}
      <Card className="border-2 border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ticket className="h-5 w-5 text-green-600" />
                Day Pass Management
              </CardTitle>
              <CardDescription>Track and manage all day pass sales</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onSellDayPass}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Ticket className="h-4 w-4 mr-1" />
                Sell Day Pass
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                onClick={() => fetchDayPasses(pagination.page)}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            {/* Date quick-filter tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'all', label: 'All' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setDateFilter(tab.id); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dateFilter === tab.id
                      ? 'bg-white text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'border-green-500 text-green-700' : ''}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="momo">MoMo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custom Date Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => { setCustomStartDate(e.target.value); setDateFilter('custom'); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => { setCustomEndDate(e.target.value); setDateFilter('custom'); }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setDateFilter('today');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setSearch('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && dayPasses.length === 0 && (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600">No day passes found</h3>
              <p className="text-sm text-gray-400 mt-1">
                {dateFilter === 'today' ? 'No day passes sold today yet.' : 'Try adjusting your filters.'}
              </p>
              <Button onClick={onSellDayPass} className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                <Ticket className="h-4 w-4 mr-2" />
                Sell First Day Pass
              </Button>
            </div>
          )}

          {/* Day Pass Table */}
          {!loading && dayPasses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Visitor</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 hidden sm:table-cell">Phone</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 hidden md:table-cell">Amount</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 hidden md:table-cell">Payment</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 hidden lg:table-cell">Date</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dayPasses.map((dp) => {
                    const payBadge = getPaymentBadge(dp.paymentMethod);
                    const isActive = dp.status === 'active';
                    const usage = visitorUsage.get(dp.userId);
                    const isFrequent = usage && usage.last30DaysPasses >= 3;
                    const shouldUpgrade = usage && usage.shouldSuggestMembership;

                    return (
                      <tr key={dp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative ${
                              shouldUpgrade
                                ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                : 'bg-gradient-to-br from-green-400 to-green-600'
                            }`}>
                              {dp.firstName.charAt(0)}{dp.lastName.charAt(0)}
                              {isFrequent && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                                  {usage.last30DaysPasses}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{dp.firstName} {dp.lastName}</p>
                                {shouldUpgrade && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                                    UPGRADE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 sm:hidden">{dp.phone}</p>
                              {usage && usage.last30DaysPasses > 1 && (
                                <p className="text-[10px] text-indigo-600 font-medium">
                                  {usage.last30DaysPasses} visits this month
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden sm:table-cell">
                          <span className="text-gray-700">{dp.phone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <span className="font-medium text-green-700">GH₵ {dp.amount}</span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${payBadge.color}`}>
                            {payBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden lg:table-cell">
                          <div>
                            <p className="text-gray-700">{formatDate(dp.startDate)}</p>
                            <p className="text-xs text-gray-400">{formatTime(dp.startDate)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            {onUpgrade && shouldUpgrade && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpgrade(dp.userId)}
                                title="Upgrade to full member"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPass(dp)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => printReceipt(dp)}
                              title="Print receipt"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setVoidingId(dp.id)}
                                title="Void day pass"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDayPasses(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDayPasses(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Week & Month Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.week.count}</p>
                  <p className="text-xs text-gray-500">Day Passes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">GH₵ {stats.week.revenue}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
              {stats.week.count > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Avg. {(stats.week.revenue / stats.week.count).toFixed(2)} GH₵ per pass
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                All Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAllTime}</p>
                  <p className="text-xs text-gray-500">Total Day Passes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeNow}</p>
                  <p className="text-xs text-gray-500">Currently Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPass && (() => {
        const usage = visitorUsage.get(selectedPass.userId);
        const shouldUpgrade = usage && usage.shouldSuggestMembership;
        return (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPass(null); }}
        >
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Day Pass Details</h2>
              <button onClick={() => setSelectedPass(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Upgrade Suggestion Banner */}
              {shouldUpgrade && usage && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-900 text-sm mb-1">💡 Frequent Visitor</h4>
                      <p className="text-xs text-purple-800 mb-2">
                        <strong>{usage.last30DaysPasses} visits</strong> in the last 30 days. Suggest upgrading to a full membership for better value!
                      </p>
                      {onUpgrade && (
                        <Button
                          size="sm"
                          onClick={() => { setSelectedPass(null); onUpgrade(selectedPass.userId); }}
                          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Upgrade to Full Member
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Visitor Info */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                  {selectedPass.firstName.charAt(0)}{selectedPass.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedPass.firstName} {selectedPass.lastName}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedPass.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedPass.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {selectedPass.status === 'active' ? 'Active' : 'Expired'}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedPass.phone}</span>
                </div>
                {selectedPass.email && !selectedPass.email.includes('@gemfitness.local') ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{selectedPass.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs italic">No email provided</span>
                  </div>
                )}
              </div>

              {/* Pass Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{formatDate(selectedPass.startDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Check-in Time</span>
                  <span className="font-medium">{formatTime(selectedPass.startDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expires</span>
                  <span className="font-medium">{formatDate(selectedPass.endDate)} {formatTime(selectedPass.endDate)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-green-700 text-base">GH₵ {selectedPass.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentBadge(selectedPass.paymentMethod).color}`}>
                    {getPaymentBadge(selectedPass.paymentMethod).label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reference</span>
                  <span className="font-mono text-xs text-gray-500">{selectedPass.reference}</span>
                </div>
              </div>

              {/* View Receipt Button */}
              {selectedPass.transactionId && (
                <div className="pt-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-2 border-green-500 text-green-700 hover:bg-green-50"
                  >
                    <a
                      href={`/api/payments/receipt/${selectedPass.transactionId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      View Official Receipt
                    </a>
                  </Button>
                </div>
              )}

              {/* Emergency Contact */}
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Contact
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Name</span>
                    <span className="font-medium text-red-900">{selectedPass.emergencyContact}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Phone</span>
                    <span className="font-medium text-red-900">{selectedPass.emergencyPhone}</span>
                  </div>
                </div>
              </div>

              {/* Visit History */}
              {usage && usage.totalPasses > 1 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                    <HistoryIcon className="h-4 w-4" />
                    Visit History
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-blue-600">Last 30 Days</p>
                      <p className="text-2xl font-bold text-blue-900">{usage.last30DaysPasses}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">All Time</p>
                      <p className="text-2xl font-bold text-blue-900">{usage.totalPasses}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => printReceipt(selectedPass)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                {selectedPass.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => { setVoidingId(selectedPass.id); setSelectedPass(null); }}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Void Pass
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Void Confirmation Modal */}
      {voidingId && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isVoiding) setVoidingId(null); }}
        >
          <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Ban className="h-7 w-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Void Day Pass?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will invalidate the day pass immediately. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setVoidingId(null)}
                disabled={isVoiding}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleVoidDayPass(voidingId)}
                disabled={isVoiding}
              >
                {isVoiding ? 'Voiding...' : 'Void Pass'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
