/**
 * Verify OTP API Endpoint
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP code sent to user's email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isOTPExpired } from '@/lib/services/email/resend';
import { sendVerifiedWelcomeEmail } from '@/lib/services/email/resend';
import logger from '@/lib/logger';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode } = body;

    // Validate input
    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      );
    }

    // Normalize OTP (remove spaces)
    const normalizedOTP = otpCode.replace(/\s/g, '');

    if (!/^\d{6}$/.test(normalizedOTP)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        otpCode: true,
        otpExpiry: true,
        otpAttempts: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            plan: true,
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified', verified: true },
        { status: 200 }
      );
    }

    // Check max attempts
    if (user.otpAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Check if OTP exists
    if (!user.otpCode) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (isOTPExpired(user.otpExpiry)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otpCode !== normalizedOTP) {
      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: user.otpAttempts + 1 },
      });

      const remainingAttempts = MAX_ATTEMPTS - (user.otpAttempts + 1);
      
      logger.warn('❌ Invalid OTP attempt:', { email, attempts: user.otpAttempts + 1 });

      return NextResponse.json(
        { 
          error: 'Invalid OTP code',
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // OTP is valid - verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpLastSent: null,
      },
    });

    logger.info('✅ Email verified successfully:', { email, userId: user.id });

    // Send welcome email
    const subscription = user.subscriptions[0];
    await sendVerifiedWelcomeEmail({
      to: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: subscription?.plan || 'ONE_MONTH',
      membershipId: user.id.slice(-8).toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

  } catch (error) {
    logger.error('❌ Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
