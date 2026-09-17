import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/services/email/mock';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and email the reset link.
 * Always returns a generic success message to avoid user enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const normalizedEmail = validation.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, emailVerified: true },
    });

    // Generic response regardless of whether the user exists
    const genericResponse = NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
    });

    if (!user || !user.emailVerified) {
      return genericResponse;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success) {
      logger.error('Failed to send password reset email', {
        email: user.email,
        message: emailResult.message,
      });
    } else {
      logger.info('Password reset email sent', { email: user.email });
    }

    return genericResponse;
  } catch (error) {
    logger.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Unable to process password reset request' },
      { status: 500 }
    );
  }
}
