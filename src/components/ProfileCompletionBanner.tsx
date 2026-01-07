'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProfileCompletionBannerProps {
  hasProfileImage: boolean;
  gracePeriodEnded: boolean;
  daysRemaining: number;
  onUploadClick: () => void;
}

export default function ProfileCompletionBanner({
  hasProfileImage,
  gracePeriodEnded,
  daysRemaining,
  onUploadClick,
}: ProfileCompletionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when grace period ends
  useEffect(() => {
    if (gracePeriodEnded && dismissed) {
      setDismissed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gracePeriodEnded]);

  // Don't show if user has profile image
  if (hasProfileImage) return null;

  // Don't show if dismissed (only for grace period, not after)
  if (dismissed && !gracePeriodEnded) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <Card
        className={`mx-4 mt-4 border-2 ${
          gracePeriodEnded
            ? 'bg-red-50 border-red-300'
            : 'bg-orange-50 border-orange-300'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`p-2 rounded-full ${
                  gracePeriodEnded ? 'bg-red-100' : 'bg-orange-100'
                }`}
              >
                {gracePeriodEnded ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Camera className="h-6 w-6 text-orange-600" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold text-lg ${
                    gracePeriodEnded ? 'text-red-900' : 'text-orange-900'
                  }`}
                >
                  {gracePeriodEnded
                    ? '⚠️ Profile Picture Required'
                    : '📸 Complete Your Profile'}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    gracePeriodEnded ? 'text-red-700' : 'text-orange-700'
                  }`}
                >
                  {gracePeriodEnded ? (
                    <>
                      Your profile is incomplete. You cannot book classes or check in until you
                      upload a profile picture. Contact reception if you need assistance.
                    </>
                  ) : (
                    <>
                      Please upload a profile picture to complete your profile.{' '}
                      <strong className="font-semibold">
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                      </strong>{' '}
                      before class bookings and check-ins are restricted.
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={onUploadClick}
                    size="sm"
                    className={
                      gracePeriodEnded
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo Now
                  </Button>
                  {!gracePeriodEnded && (
                    <Button
                      onClick={() => setDismissed(true)}
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      Remind Me Later
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {!gracePeriodEnded && (
              <button
                onClick={() => setDismissed(true)}
                className="text-orange-600 hover:text-orange-800 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
