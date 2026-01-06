'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, RefreshCw, Home, Mail, Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface PaymentError {
  reference?: string;
  message?: string;
  reason?: string;
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const reference = searchParams.get('reference');
  const message = searchParams.get('message');
  const reason = searchParams.get('reason');
  
  const [retrying, setRetrying] = useState(false);
  const error: PaymentError = {
    reference: reference || undefined,
    message: message || 'Payment was not completed',
    reason: reason || undefined,
  };

  const getErrorMessage = () => {
    if (error.reason) {
      const reasonMap: Record<string, string> = {
        cancelled: 'You cancelled the payment',
        timeout: 'Payment session timed out',
        declined: 'Your card was declined',
        insufficient_funds: 'Insufficient funds in your account',
        invalid_card: 'Invalid card details',
        network_error: 'Network connection error',
      };
      return reasonMap[error.reason] || error.reason;
    }
    return error.message || 'Payment failed';
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (error.reason === 'declined' || error.reason === 'insufficient_funds') {
      suggestions.push('Please check your card balance and try again');
      suggestions.push('Try using a different payment method');
    } else if (error.reason === 'invalid_card') {
      suggestions.push('Verify your card details are correct');
      suggestions.push('Ensure your card is enabled for online payments');
    } else if (error.reason === 'network_error') {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
    } else if (error.reason === 'timeout') {
      suggestions.push('The session expired - you can retry immediately');
    } else {
      suggestions.push('Please try again or contact support if the problem persists');
    }
    
    return suggestions;
  };

  const handleRetry = async () => {
    setRetrying(true);
    // Redirect back to signup page
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Error Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-xl text-gray-600">
            {getErrorMessage()}
          </p>
        </motion.div>

        {/* Error Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                What Happened?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error.reference && (
                <div>
                  <p className="text-sm text-gray-600">Transaction Reference</p>
                  <p className="font-mono font-semibold text-gray-900">{error.reference}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Possible reasons:</p>
                <ul className="list-disc list-inside space-y-1">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700">{suggestion}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>What Would You Like to Do?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-4"
                >
                  {retrying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Try Again</div>
                        <div className="text-xs font-normal opacity-90">
                          Return to signup page
                        </div>
                      </div>
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full h-auto py-4"
                >
                  <Home className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">Go Home</div>
                    <div className="text-xs font-normal text-gray-600">
                      Return to homepage
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription>Our support team is here to assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Mail className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Email Support</p>
                    <a
                      href="mailto:support@gemfitness.com"
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      support@gemfitness.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Phone className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Phone Support</p>
                    <a
                      href="tel:+233123456789"
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      +233 123 456 789
                    </a>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Link href="/contact">
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Was I charged?</p>
                  <p className="text-sm text-gray-600">
                    No. Since the payment failed, no charges were made to your account.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-1">Can I try a different payment method?</p>
                  <p className="text-sm text-gray-600">
                    Yes! When you retry, you&apos;ll have the option to choose from card, bank transfer, mobile money, and more.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-1">Is my signup information saved?</p>
                  <p className="text-sm text-gray-600">
                    You&apos;ll need to fill in the signup form again. We recommend having your information ready.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-1">What payment methods do you accept?</p>
                  <p className="text-sm text-gray-600">
                    We accept all major credit/debit cards, bank transfers, mobile money (MTN, Vodafone, AirtelTigo), and USSD.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
