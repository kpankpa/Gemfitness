'use client';

import { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

interface ParQBannerProps {
  parqCompleted: boolean;
  firstName: string;
}

export default function ParQBanner({ parqCompleted, firstName }: ParQBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already completed or dismissed
  if (parqCompleted || dismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg shadow-sm relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-yellow-700 hover:text-yellow-900"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚕️ Health Screening Required
          </h3>
          <p className="text-yellow-800 mb-3">
            Hi {firstName}! We now require all members to complete a quick health screening 
            (PAR-Q) for your safety. This helps us create the best training program for you.
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            <strong>Deadline:</strong> February 6, 2026 (30 days) • <strong>Time:</strong> ~3 minutes
          </p>
          <Link href="/member/par-q">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              Complete Health Screening
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
