'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, User, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface PaymentData {
  success: boolean;
  reference: string;
  amount: number;
  status: string;
  paid_at: string;
  customer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  channel: string;
  authorization_code?: string;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  qrToken: string;
  subscription: {
    plan: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!reference) {
      // Set error state in next tick to avoid cascading renders
      setTimeout(() => {
        setError('No payment reference found');
        setLoading(false);
      }, 0);
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);
        
        // Verify payment with Paystack
        const verifyResponse = await fetch(`/api/payment/verify?reference=${reference}`);
        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData.success) {
          setError(verifyData.message || 'Payment verification failed');
          setLoading(false);
          return;
        }

        setPaymentData(verifyData);

        // Fetch user data (payment webhook should have created the user)
        // Wait a bit for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const userResponse = await fetch('/api/auth/session');
        const sessionData = await userResponse.json();

        if (userResponse.ok && sessionData.user) {
          setUserData(sessionData.user);
        }

        setLoading(false);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [reference]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `GH₵${(amount / 100).toFixed(2)}`;
  };

  const getPlanName = (plan: string) => {
    const planMap: Record<string, string> = {
      ONE_MONTH: 'Monthly',
      THREE_MONTHS: 'Quarterly',
      ONE_YEAR: 'Annual',
    };
    return planMap[plan] || plan;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-12 pb-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h3>
                <p className="text-gray-600">Please wait while we confirm your transaction...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Reference: <span className="font-mono font-semibold">{reference}</span>
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/contact')}
                variant="outline"
                className="flex-1"
              >
                Contact Support
              </Button>
              <Button
                onClick={() => router.push('/')}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to <span className="text-orange-500 font-semibold">GemFitness</span>
          </p>
        </motion.div>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentData && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Reference Number</p>
                      <p className="font-mono font-semibold text-gray-900">{paymentData.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatAmount(paymentData.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold text-gray-900 capitalize">{paymentData.channel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(paymentData.paid_at)}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">Customer Email</p>
                    <p className="font-semibold text-gray-900">{paymentData.customer.email}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Membership Details */}
        {userData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-6 border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-600" />
                  Membership Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Member Name</p>
                    <p className="font-semibold text-gray-900">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Membership Plan</p>
                    <p className="font-semibold text-gray-900">
                      {getPlanName(userData.subscription.plan)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(userData.subscription.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(userData.subscription.endDate)}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">Your Member QR Code</p>
                  <div className="flex justify-center">
                    <QRCodeDisplay data={userData.qrToken} size={200} />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Show this QR code at the gym entrance to check in
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>What&apos;s Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-orange-600">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Check Your Email</p>
                    <p className="text-sm text-gray-600">
                      We&apos;ve sent a welcome email with your membership details and QR code
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-orange-600">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Visit the Gym</p>
                    <p className="text-sm text-gray-600">
                      Show your QR code at the entrance to check in and start your fitness journey
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-orange-600">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Explore Your Dashboard</p>
                    <p className="text-sm text-gray-600">
                      Access your member dashboard to book classes, track progress, and more
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => router.push('/dashboard/member')}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  <User className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Contact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-orange-500 hover:text-orange-600 font-semibold">
              Contact our support team
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
