'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      handleVerify(pastedData);
    }
  };

  // Verify OTP
  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: code }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // ✅ SECURITY: After OTP verified, set the user's real password
        // Password was stored in sessionStorage during signup (never sent to payment provider)
        const pendingPassword = sessionStorage.getItem('pendingPassword');
        const pendingEmail = sessionStorage.getItem('pendingEmail');
        
        if (pendingPassword && pendingEmail === email) {
          try {
            const passwordResponse = await fetch('/api/auth/set-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: email,
                password: pendingPassword 
              }),
            });
            
            if (passwordResponse.ok) {
              // Clear sessionStorage after password is set
              sessionStorage.removeItem('pendingPassword');
              sessionStorage.removeItem('pendingEmail');
              console.log('✅ Password set successfully');
            } else {
              console.warn('⚠️ Password setting failed, user may need to reset');
            }
          } catch (pwError) {
            console.error('Password setting error:', pwError);
          }
        }
        
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 2000);
      } else {
        setError(data.error || 'Verification failed');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendCooldown(60); // 60 second cooldown
        setRemainingAttempts(5); // Reset attempts
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
        setError(data.error || 'Failed to resend code');
      }
    } catch {
      setError('Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  // Skip verification (dev mode only)
  const handleSkipVerification = async () => {
    if (!email) return;

    const confirmed = window.confirm(
      'Are you sure you want to skip email verification? This is only available in development mode.'
    );
    
    if (!confirmed) return;

    setIsSkipping(true);
    setError('');

    try {
      // Get the actual password from sessionStorage (entered during signup)
      const pendingPassword = sessionStorage.getItem('pendingPassword');
      
      const response = await fetch('/api/auth/skip-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          password: pendingPassword // Send actual signup password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear sessionStorage after successful verification skip
        sessionStorage.removeItem('pendingPassword');
        sessionStorage.removeItem('pendingEmail');
        
        setSuccess(true);
        // Skip-verification does not create a session, so redirect to login.
        // The user can log in after verifying the email and setting a password.
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 2000);
      } else {
        setError(data.error || 'Failed to skip verification');
      }
    } catch {
      setError('Failed to skip verification. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  // Mask email for display
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : 'your email';

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified! 🎉</h1>
          <p className="text-gray-600 mb-6">
            Your account is now active. Redirecting you to login...
          </p>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We&apos;ve sent a 6-digit code to<br />
            <span className="font-medium text-gray-900">{maskedEmail}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all
                  ${error 
                    ? 'border-red-300 bg-red-50 text-red-600' 
                    : digit 
                      ? 'border-green-300 bg-green-50 text-green-600' 
                      : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  }
                  ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600">{error}</span>
          </motion.div>
        )}

        {/* Remaining Attempts Warning */}
        {remainingAttempts < 5 && remainingAttempts > 0 && (
          <p className="text-center text-sm text-amber-600 mb-4">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </p>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={otp.some(d => !d) || isVerifying}
          className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
            ${otp.every(d => d) && !isVerifying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Email
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Resend Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors
              ${resendCooldown > 0 || isResending
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-500 hover:text-red-600'
              }
            `}
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend in {resendCooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Code
              </>
            )}
          </button>
        </div>

        {/* Skip Verification Button (Dev Mode Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-full h-px bg-gray-200"></div>
              <span className="px-3 text-xs text-gray-400 bg-white">DEV MODE</span>
              <div className="w-full h-px bg-gray-200"></div>
            </div>
            <button
              onClick={handleSkipVerification}
              disabled={isSkipping || isVerifying}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border
                ${isSkipping || isVerifying
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 hover:border-yellow-300'
                }
              `}
            >
              {isSkipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Skipping...
                </>
              ) : (
                <>
                  Skip Verification
                </>
              )}
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 text-center">
            💡 Check your spam folder if you don&apos;t see the email.<br />
            The code expires in 15 minutes.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
