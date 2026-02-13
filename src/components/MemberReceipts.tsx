// Member Receipts Component
// src/components/MemberReceipts.tsx

'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Receipt, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PaymentStatus = 'success' | 'pending' | 'failed';

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
  plan: string;
  metadata: Record<string, unknown> | null;
};

type Summary = {
  totalSpent: number;
  totalTransactions: number;
  successfulPayments: { count: number; amount: number };
};

export default function MemberReceipts() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const fetchReceipts = async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', PAGE_SIZE.toString());
    if (status !== 'all') params.set('status', status);

    try {
      const response = await fetch(`/api/member/receipts?${params.toString()}`);
      if (!response.ok) {
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

  const formatMethod = (methodValue: string) => {
    if (methodValue === 'paystack') return 'Card/Bank';
    if (methodValue === 'momo') return 'MTN MoMo';
    return methodValue.toUpperCase();
  };

  const formatPlan = (plan: string) => {
    if (plan === 'DAILY') return 'Day Pass';
    return plan.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl">Payment Summary</CardTitle>
          <CardDescription>Your payment history overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-green-700">
                GH₵ {summary?.totalSpent?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summary?.totalTransactions || 0} transactions
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Successful Payments</p>
              <p className="text-2xl font-bold text-blue-700">
                {summary?.successfulPayments?.count || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                GH₵ {summary?.successfulPayments?.amount?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as 'all' | PaymentStatus);
                }}
                className="w-full px-3 py-2 bg-white border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 font-semibold text-orange-700"
              >
                <option value="all">All Payments</option>
                <option value="success">Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Receipts List */}
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Receipts</CardTitle>
              <CardDescription>View and download your payment receipts</CardDescription>
            </div>
            {loading && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
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
                          : new Date(payment.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {formatPlan(payment.plan)}
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
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
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
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        {loading ? 'Loading receipts...' : 'No receipts found'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Your payment receipts will appear here
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t-2">
              <p className="text-sm text-gray-600">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
