'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentStatus = 'success' | 'pending' | 'failed';

type PaymentSummary = {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: { count: number; amount: number };
  pendingPayments: { count: number; amount: number };
  failedPayments: { count: number; amount: number };
};

type PaymentTransaction = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
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
};

const PAGE_SIZE = 20;

export default function ReceiptsManager() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [method, setMethod] = useState<'all' | 'paystack' | 'momo' | 'cash'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', PAGE_SIZE.toString());
    if (status !== 'all') params.set('status', status);
    if (method !== 'all') params.set('method', method);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (searchDebounce.trim()) params.set('search', searchDebounce.trim());

    try {
      const response = await fetch(`/api/payments/history?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) {
          setError('Access restricted. Manager access required.');
          return;
        }
        setError('Failed to fetch receipts');
        return;
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Failed to fetch receipts');
        return;
      }

      setTransactions(data.data || []);
      setSummary(data.summary || null);
      setPages(data.pagination?.pages || 1);
    } catch {
      setError('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, method, startDate, endDate, searchDebounce]);

  const formatMethod = (methodValue: string) => {
    if (methodValue === 'paystack') return 'Card/Bank';
    if (methodValue === 'momo') return 'MTN MoMo';
    return methodValue.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Receipts</CardTitle>
          <CardDescription>Find and open member payment receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700">
                GH₵ {summary?.totalRevenue?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summary?.totalTransactions?.toLocaleString() || '0'} transactions
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Successful</p>
              <p className="text-2xl font-bold text-blue-700">
                {summary?.successfulPayments?.count?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                GH₵ {summary?.successfulPayments?.amount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {summary?.pendingPayments?.count?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                GH₵ {summary?.pendingPayments?.amount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-700">
                {summary?.failedPayments?.count?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-red-600 mt-1">
                GH₵ {summary?.failedPayments?.amount?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Filter receipts by status, method, date, or search by member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as 'all' | PaymentStatus);
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Method</label>
              <select
                value={method}
                onChange={(e) => {
                  setPage(1);
                  setMethod(e.target.value as 'all' | 'paystack' | 'momo' | 'cash');
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="all">All</option>
                <option value="paystack">Card/Bank</option>
                <option value="momo">MTN MoMo</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPage(1);
                  setStartDate(e.target.value);
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPage(1);
                  setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email, or reference"
                  maxLength={100}
                  className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Receipt List</CardTitle>
              <CardDescription>Click a receipt to open the printable version</CardDescription>
            </div>
            {loading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading receipts...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {transactions.length > 0 ? (
                  transactions.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div>
                          <p>{payment.member?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{payment.member?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.member?.plan ? payment.member.plan.replace('_', ' ') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatMethod(payment.paymentMethod)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payment.status === 'success'
                            ? 'Success'
                            : payment.status === 'pending'
                            ? 'Pending'
                            : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {payment.reference}
                      </td>
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
                      {loading ? 'Loading receipts...' : 'No receipts found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                disabled={page >= pages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
