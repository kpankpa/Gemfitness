'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Paystack redirects here with ?reference=...&trxref=...
 * We verify the transaction and route to success or failed.
 */
function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference =
    searchParams.get('reference') || searchParams.get('trxref') || '';

  useEffect(() => {
    if (!reference) {
      router.replace('/payment/failed?reason=missing_reference');
      return;
    }

    let cancelled = false;

    const routePayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?reference=${encodeURIComponent(reference)}`);
        const data = await response.json();

        if (cancelled) return;

        if (response.ok && data.success) {
          router.replace(`/payment/success?reference=${encodeURIComponent(reference)}`);
        } else {
          const reason = encodeURIComponent(data.message || 'verification_failed');
          router.replace(
            `/payment/failed?reference=${encodeURIComponent(reference)}&reason=${reason}`
          );
        }
      } catch {
        if (!cancelled) {
          router.replace(
            `/payment/failed?reference=${encodeURIComponent(reference)}&reason=network_error`
          );
        }
      }
    };

    routePayment();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
      <p className="text-gray-700 font-medium">Confirming your payment...</p>
      <p className="text-sm text-gray-500 mt-2">Please wait while we verify with Paystack.</p>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
