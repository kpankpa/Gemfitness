/**
 * Set Password API Endpoint
 * POST /api/auth/set-password
 * 
 * SECURITY: This endpoint sets the user's password after OTP verification
 * Password is stored client-side in sessionStorage during signup and sent here
 * after the user successfully verifies their email via OTP.
 * 
 * This approach follows OWASP best practices:
 * - Password never sent to third-party payment providers
 * - Password only transmitted over HTTPS to own backend
 * - Password immediately hashed with bcrypt before storage
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';
import logger from '@/lib/logger';

// Validation schema
const setPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = setPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Use generic error to prevent user enumeration
      return NextResponse.json(
        { error: 'Unable to set password. Please try again.' },
        { status: 400 }
      );
    }

    // SECURITY: Only allow password setting if:
    // 1. Email is verified (OTP completed)
    // 2. Password hasn't been set yet (first time only)
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first' },
        { status: 400 }
      );
    }

    if (user.passwordSet) {
      return NextResponse.json(
        { error: 'Password already set. Use forgot password to reset.' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (12 salt rounds)
    const hashedPassword = await hashPassword(password);

    // Update user with real password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordSet: true,
        updatedAt: new Date(),
      },
    });

    logger.info('✅ Password set successfully:', { 
      email: normalizedEmail,
      userId: user.id 
    });

    // Log in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(60));
      console.log('🔐 PASSWORD SET SUCCESSFULLY (DEV MODE)');
      console.log('='.repeat(60));
      console.log(`Email: ${normalizedEmail}`);
      console.log('Password: [SECURELY HASHED - not logged]');
      console.log('Status: User can now login');
      console.log('='.repeat(60) + '\n');
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now login.',
    });

  } catch (error) {
    logger.error('❌ Error setting password:', error);
    return NextResponse.json(
      { error: 'Failed to set password. Please try again.' },
      { status: 500 }
    );
  }
}
