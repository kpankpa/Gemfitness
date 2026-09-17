import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordRequirements } from '@/lib/auth/passwords';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/reset-password
 * Reset password using a valid reset token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    const requirements = validatePasswordRequirements(password);
    if (!requirements.isValid) {
      return NextResponse.json(
        { error: requirements.errors[0] || 'Password does not meet requirements' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordSet: true,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    logger.info('Password reset successful', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Unable to reset password' },
      { status: 500 }
    );
  }
}
