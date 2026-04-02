'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Subscription } from '@/types';

interface SubscriptionManagementProps {
  subscription: Subscription;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

interface PlanPreview {
  currentPrice: number;
  newPrice: number;
  proratedAmount: number;
  message: string;
}

const PLAN_NAMES: Record<string, string> = {
  DAILY: 'Day Pass',
  ONE_MONTH: 'Monthly Plan',
  THREE_MONTHS: 'Quarterly Plan',
  ONE_YEAR: 'Annual Plan',
};

const PLAN_PRICES: Record<string, number> = {
  DAILY: 30,
  ONE_MONTH: 200,
  THREE_MONTHS: 500,
  ONE_YEAR: 2200,
};

type TabType = 'overview' | 'change-plan' | 'pause-resume' | 'payment';

export default function SubscriptionManagement({
  subscription,
  onUpdate,
  isAdmin = false,
}: SubscriptionManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Plan change state
  const [selectedPlan, setSelectedPlan] = useState<'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR' | null>(null);
  const [planPreview, setPlanPreview] = useState<PlanPreview | null>(null);
  const [changeReason, setChangeReason] = useState('');

  // Pause/Resume state
  const [resumeDate, setResumeDate] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  // Payment method state
  const [authorizationCode, setAuthorizationCode] = useState('');

  const daysUntilExpiry = Math.ceil(
    (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysUntilResume = subscription.resumeDate
    ? Math.ceil((new Date(subscription.resumeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Preview plan change
  const handlePreviewPlanChange = async (newPlan: 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR') => {
    if (newPlan === subscription.plan) {
      setError('This is your current plan');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=preview-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan }),
      });

      const data = await response.json();
      if (data.success) {
        setPlanPreview(data.preview);
        setSelectedPlan(newPlan);
      } else {
        setError(data.error || 'Failed to preview plan change');
      }
    } catch {
      setError('Failed to preview plan change');
    } finally {
      setLoading(false);
    }
  };

  // Upgrade plan
  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: selectedPlan, reason: changeReason }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully upgraded to ${PLAN_NAMES[selectedPlan]}!`);
        setSelectedPlan(null);
        setPlanPreview(null);
        setChangeReason('');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to upgrade plan');
      }
    } catch {
      setError('Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  // Downgrade plan
  const handleDowngrade = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=downgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan: selectedPlan, reason: changeReason }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully downgraded to ${PLAN_NAMES[selectedPlan]}!`);
        setSelectedPlan(null);
        setPlanPreview(null);
        setChangeReason('');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to downgrade plan');
      }
    } catch {
      setError('Failed to downgrade plan');
    } finally {
      setLoading(false);
    }
  };

  // Renew subscription
  const handleRenew = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=renew`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Subscription renewed successfully!');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to renew subscription');
      }
    } catch {
      setError('Failed to renew subscription');
    } finally {
      setLoading(false);
    }
  };

  // Pause subscription
  const handlePause = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeDate: resumeDate || undefined,
          reason: pauseReason || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Subscription paused successfully!');
        setResumeDate('');
        setPauseReason('');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to pause subscription');
      }
    } catch {
      setError('Failed to pause subscription');
    } finally {
      setLoading(false);
    }
  };

  // Resume subscription
  const handleResume = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=resume`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Subscription resumed successfully!');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to resume subscription');
      }
    } catch {
      setError('Failed to resume subscription');
    } finally {
      setLoading(false);
    }
  };

  // Update payment method
  const handleUpdatePaymentMethod = async () => {
    if (!authorizationCode.trim()) {
      setError('Please enter an authorization code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}?action=payment-method`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationCode }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Payment method updated successfully!');
        setAuthorizationCode('');
        onUpdate?.();
      } else {
        setError(data.message || 'Failed to update payment method');
      }
    } catch {
      setError('Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Pause className="w-4 h-4" />
            Paused
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Manage this member's subscription and billing settings"
                : 'Manage your membership plan and settings'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('change-plan')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'change-plan'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Change Plan
          </button>
          <button
            onClick={() => setActiveTab('pause-resume')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'pause-resume'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pause/Resume
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'payment'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment Method
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-xl font-bold text-gray-900">{PLAN_NAMES[subscription.plan]}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-xl font-bold text-gray-900">GH₵ {subscription.amount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                <p className="text-lg font-semibold text-gray-900">
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                </p>
              </div>
            </div>

            {subscription.status === 'PAUSED' && subscription.resumeDate && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-1">Subscription Paused</p>
                <p className="text-sm text-yellow-700">
                  Will resume on {new Date(subscription.resumeDate).toLocaleDateString()}
                  {daysUntilResume && ` (in ${daysUntilResume} days)`}
                </p>
              </div>
            )}

            {subscription.renewalStatus && subscription.renewalStatus !== 'PENDING' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Renewal Status</p>
                <p className="text-sm text-blue-700">{subscription.renewalStatus}</p>
                {subscription.lastRenewalFailureReason && (
                  <p className="text-sm text-blue-600 mt-1">Reason: {subscription.lastRenewalFailureReason}</p>
                )}
              </div>
            )}

            {!subscription.paymentMethodId && subscription.status === 'ACTIVE' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-900 mb-1">Payment Method Required</p>
                <p className="text-sm text-orange-700">
                  Add a payment method to enable automatic renewal before your subscription expires.
                </p>
              </div>
            )}

            {subscription.status === 'ACTIVE' && (isAdmin || (daysUntilExpiry <= 7 && daysUntilExpiry > 0)) && (
              <div className="flex gap-2">
                <Button onClick={handleRenew} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Renew Now
                </Button>
              </div>
            )}

            {subscription.status === 'EXPIRED' && (
              <div className="flex gap-2">
                <Button onClick={handleRenew} disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Renew Subscription
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Change Plan Tab */}
        {activeTab === 'change-plan' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select New Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR'] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => handlePreviewPlanChange(plan)}
                    disabled={loading || plan === subscription.plan}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      plan === subscription.plan
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : selectedPlan === plan
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{PLAN_NAMES[plan]}</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">GH₵ {PLAN_PRICES[plan]}</p>
                    {plan === subscription.plan && (
                      <p className="text-sm text-gray-500 mt-2">Current Plan</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {planPreview && selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h4 className="font-semibold text-blue-900 mb-3">Plan Change Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Current Plan:</span>
                    <span className="font-medium text-blue-900">
                      {PLAN_NAMES[subscription.plan]} (GH₵ {planPreview.currentPrice})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">New Plan:</span>
                    <span className="font-medium text-blue-900">
                      {PLAN_NAMES[selectedPlan]} (GH₵ {planPreview.newPrice})
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-blue-700 font-medium">
                      {planPreview.proratedAmount >= 0 ? 'Amount to Pay:' : 'Credit Applied:'}
                    </span>
                    <span className="font-bold text-blue-900">
                      GH₵ {Math.abs(planPreview.proratedAmount).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-blue-600 text-xs pt-2">{planPreview.message}</p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for change (optional)
                  </label>
                  <input
                    type="text"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="e.g., Upgrading for more features"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={PLAN_PRICES[selectedPlan] > PLAN_PRICES[subscription.plan] ? handleUpgrade : handleDowngrade}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : PLAN_PRICES[selectedPlan] > PLAN_PRICES[subscription.plan] ? (
                      <TrendingUp className="w-4 h-4 mr-2" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-2" />
                    )}
                    Confirm Change
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedPlan(null);
                      setPlanPreview(null);
                      setChangeReason('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Pause/Resume Tab */}
        {activeTab === 'pause-resume' && (
          <div className="space-y-6">
            {subscription.status === 'PAUSED' ? (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Resume Subscription</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your subscription is currently paused.
                  {subscription.resumeDate &&
                    ` It will automatically resume on ${new Date(subscription.resumeDate).toLocaleDateString()}.`}
                </p>
                <Button onClick={handleResume} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Resume Now
                </Button>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pause Subscription</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Pausing your subscription will extend your membership by the pause duration. You will not have access
                  during this time.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume Date (optional)
                    </label>
                    <input
                      type="date"
                      value={resumeDate}
                      onChange={(e) => setResumeDate(e.target.value)}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to pause for 30 days</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <textarea
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      placeholder="e.g., Traveling, Medical reasons"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <Button onClick={handlePause} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pause className="w-4 h-4 mr-2" />}
                    Pause Subscription
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Tab */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
              <p className="text-sm text-gray-600 mb-4">
                {subscription.paymentMethodId
                  ? 'You have a payment method on file for automatic renewals.'
                  : 'Add a payment method to enable automatic renewals.'}
              </p>

              {subscription.paymentMethodId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Payment Method Active</p>
                    <p className="text-xs text-green-700">Your subscription will renew automatically</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paystack Authorization Code
                  </label>
                  <input
                    type="text"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                    placeholder="AUTH_xxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can get this from your Paystack dashboard or after making a card payment
                  </p>
                </div>

                <Button onClick={handleUpdatePaymentMethod} disabled={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Update Payment Method
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
