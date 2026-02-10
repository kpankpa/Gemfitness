'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, CreditCard, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCreationError, setUserCreationError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

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

        // Create user account from payment data
        await createUserFromPayment(verifyData, reference);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    const createUserFromPayment = async (verifyData: any, ref: string) => {
      try {
        console.log('Creating user account from payment data...');
        
        const createUserResponse = await fetch('/api/auth/create-user-from-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentData: verifyData,
            reference: ref,
          }),
        });

        const createUserData = await createUserResponse.json();
        
        if (createUserResponse.ok && createUserData.success) {
          console.log('User created successfully, redirecting to verification');
          router.push(`/verify-email?email=${encodeURIComponent(verifyData.customer.email)}`);
          return;
        } else {
          // Handle errors properly - show to user, don't redirect
          console.error('Failed to create user:', createUserData.message);
          
          // Special case: user already exists (duplicate)
          if (createUserData.error === 'DUPLICATE_USER') {
            console.log('User already exists, redirecting to verification');
            router.push(`/verify-email?email=${encodeURIComponent(verifyData.customer.email)}`);
            return;
          }
          
          // For other errors, show error message to user
          setUserCreationError(
            createUserData.message || 
            'Failed to create your account. Your payment was successful, but we encountered an issue setting up your membership.'
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error creating user:', error);
        setUserCreationError(
          'A network error occurred while creating your account. Your payment was successful.'
        );
        setLoading(false);
        return;
      }
    };
        // Fallback: Try to fetch existing user session (for cases where user already exists)

    verifyPayment();
  }, [reference, router]);

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
      // Handle user creation errors (payment succeeded but account creation failed)
      if (userCreationError) {
        const handleRetry = async () => {
          if (!paymentData || !reference) return;
      
          setRetrying(true);
          setUserCreationError('');
      
          try {
            const createUserResponse = await fetch('/api/auth/create-user-from-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentData: paymentData,
                reference: reference,
              }),
            });

            const createUserData = await createUserResponse.json();
        
            if (createUserResponse.ok && createUserData.success) {
              router.push(`/verify-email?email=${encodeURIComponent(paymentData.customer.email)}`);
            } else if (createUserData.error === 'DUPLICATE_USER') {
              router.push(`/verify-email?email=${encodeURIComponent(paymentData.customer.email)}`);
            } else {
              setUserCreationError(
                createUserData.message || 
                'Retry failed. Please contact support with your payment reference.'
              );
            }
          } catch {
            setUserCreationError('Network error during retry. Please contact support.');
          } finally {
            setRetrying(false);
          }
        };

        return (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-2xl border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-green-600">Payment Successful</CardTitle>
                    <CardDescription className="text-gray-600">
                      {paymentData && formatAmount(paymentData.amount)} charged successfully
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">Account Setup Issue</p>
                    <p className="text-sm text-orange-800">{userCreationError}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Payment Reference:</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{reference}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Save this reference number. Your payment was successful, but we need to complete your account setup.
                  </p>
                </div>
            
                {paymentData && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatAmount(paymentData.amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatDate(paymentData.paid_at)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-semibold text-gray-900">{paymentData.customer.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                  >
                    {retrying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Account Setup
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      const body = encodeURIComponent(
                        `Hi GemFitness Support,\n\nMy payment was successful but I encountered an issue during account setup.\n\nPayment Reference: ${reference}\nEmail: ${paymentData?.customer.email || ''}\n\nPlease help me complete my membership setup.\n\nThank you.`
                      );
                      window.open(`https://wa.me/233249003832?text=${body}`, '_blank');
                    }}
                    variant="outline"
                    className="flex-1 border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    Contact Support
                  </Button>
                </div>
            
                <p className="text-xs text-center text-gray-500 pt-2">
                  Don&apos;t worry! Your payment is secure and we&apos;ll help you complete your membership.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      }
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

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                  onClick={() => router.push('/')}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
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
