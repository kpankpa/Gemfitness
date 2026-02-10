// Quick diagnostic script to check member creation
// Run this in browser console after payment

/* eslint-disable @typescript-eslint/no-unused-vars */
async function diagnoseMemberCreation(email) {
  console.log('🔍 Diagnosing member creation for:', email);

  const isBrowser = typeof window !== 'undefined';
  const isDev = isBrowser
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');

  try {
    // Check if user exists via session
    const sessionRes = await fetch('/api/auth/session');
    let session = null;
    try {
      session = await sessionRes.json();
    } catch {
      session = { error: 'Invalid JSON response from /api/auth/session' };
    }
    console.log('📋 Session check:', { ok: sessionRes.ok, status: sessionRes.status, data: session });
    
    // Try to check via OTP endpoint (dev mode only)
    if (isDev) {
      const otpRes = await fetch(`/api/dev/get-otp?email=${encodeURIComponent(email)}`);
      let otpData = null;
      try {
        otpData = await otpRes.json();
      } catch {
        otpData = { error: 'Invalid JSON response from /api/dev/get-otp' };
      }
      console.log('📧 OTP check:', { ok: otpRes.ok, status: otpRes.status, data: otpData });
    }
    
    return {
      hasSession: !!session.user,
      email: session.user?.email,
      emailVerified: session.user?.emailVerified,
      role: session.user?.role
    };
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error: error?.message || String(error) };
  }
}

// Usage:
// diagnoseMemberCreation('customer@example.com')

// Make function available globally for console use
if (typeof window !== 'undefined') {
  window.diagnoseMemberCreation = diagnoseMemberCreation;
}
