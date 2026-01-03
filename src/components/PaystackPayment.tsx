'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PaystackConfig {
  key: string | undefined;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  metadata: {
    eventId: string;
    eventTitle: string;
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

interface PaystackResponse {
  status: string;
  reference: string;
}

interface PaystackPaymentProps {
  amount: number;
  eventId: string;
  eventTitle: string;
  userEmail: string;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

export default function PaystackPayment({
  amount,
  eventId,
  eventTitle,
  userEmail,
  onSuccess,
  onError,
  disabled = false
}: PaystackPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (!window.PaystackPop) {
      onError('Paystack library not loaded');
      return;
    }

    setIsProcessing(true);

    const reference = `EVT-${eventId.slice(-6).toUpperCase()}-${Date.now()}`;

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: userEmail,
      amount: amount * 100, // Convert to kobo
      currency: 'GHS',
      reference,
      metadata: {
        eventId,
        eventTitle,
      },
      callback: function(response: PaystackResponse) {
        setIsProcessing(false);
        if (response.status === 'success') {
          onSuccess(response.reference);
        } else {
          onError('Payment was not completed');
        }
      },
      onClose: function() {
        setIsProcessing(false);
        onError('Payment window closed');
      }
    });

    handler.openIframe();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-700">Event:</span>
            <span className="font-medium text-blue-900">{eventTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Amount:</span>
            <span className="font-bold text-blue-900 text-lg">GH₵ {amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Processing Payment...
          </div>
        ) : (
          <>
            💳 Pay GH₵ {amount.toFixed(2)} with Paystack
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Secured by Paystack • Cards, Mobile Money, Bank Transfer accepted</p>
      </div>
    </div>
  );
}