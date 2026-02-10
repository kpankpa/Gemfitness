import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

/**
 * DEV ONLY: Get OTP for testing
 * 
 * This endpoint is ONLY for development/testing when Resend is in test mode
 * It retrieves the OTP code from the database for a given email
 * 
 * Usage: GET /api/dev/get-otp?email=user@example.com
 * 
 * ⚠️ WARNING: This endpoint should be disabled in production!
 */

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Only allow in development/test mode
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ Dev endpoint accessed in production!');
      return NextResponse.json(
        { error: 'This endpoint is not available in production' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required', example: '/api/dev/get-otp?email=user@example.com' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    logger.info('🔧 [DEV] Retrieving OTP for email:', { email });

    // Find user with this email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        otpCode: true,
        otpExpiry: true,
        otpAttempts: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      logger.warn('⚠️ [DEV] User not found:', { email });
      return NextResponse.json(
        { 
          error: 'User not found', 
          email,
          tip: 'Make sure you completed the signup and payment first'
        },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    const isExpired = user.otpExpiry ? new Date() > user.otpExpiry : true;

    logger.info('🔧 [DEV] OTP retrieved:', {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      otpCode: user.otpCode,
      isExpired,
      expiresAt: user.otpExpiry,
      attempts: user.otpAttempts,
      emailVerified: user.emailVerified,
    });

    return NextResponse.json({
      success: true,
      devMode: true,
      warning: '🔧 This is development mode only - delete this endpoint in production',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      otp: {
        code: user.otpCode,
        expiresAt: user.otpExpiry,
        isExpired: isExpired,
        attempts: user.otpAttempts,
        attemptsRemaining: Math.max(0, 5 - (user.otpAttempts || 0)),
      },
      instructions: [
        '1. Copy the OTP code above',
        '2. Navigate to /verify-email?email=' + encodeURIComponent(email),
        '3. Paste the OTP code in the verification form',
        '4. Click "Verify" to complete registration',
      ],
    });

  } catch (error) {
    logger.error('❌ [DEV] Error retrieving OTP:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
