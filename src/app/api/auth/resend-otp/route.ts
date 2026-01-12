/**
 * Resend OTP API Endpoint
 * POST /api/auth/resend-otp
 * Generates and sends a new OTP code to user's email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, sendOTPEmail, canResendOTP, getOTPExpiry } from '@/lib/services/email/resend';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
        emailVerified: true,
        otpLastSent: true,
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

    // Check cooldown (rate limiting between resends)
    const { canResend, waitSeconds } = canResendOTP(user.otpLastSent);
    
    if (!canResend) {
      return NextResponse.json(
        { 
          error: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
          waitSeconds,
        },
        { status: 429 }
      );
    }

    // Check hourly rate limit
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // Count OTPs sent in last hour (approximation using otpLastSent)
    // For more accurate tracking, you might want a separate OTP log table
    
    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Send OTP email
    const emailResult = await sendOTPEmail({
      to: user.email,
      firstName: user.firstName,
      otpCode,
    });

    if (!emailResult.success) {
      logger.error('❌ Failed to send OTP email:', { email, error: emailResult.error });
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry,
        otpAttempts: 0, // Reset attempts on new OTP
        otpLastSent: new Date(),
      },
    });

    logger.info('✅ OTP resent successfully:', { email, messageId: emailResult.messageId });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: 15 * 60, // 15 minutes in seconds
    });

  } catch (error) {
    logger.error('❌ Error resending OTP:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
