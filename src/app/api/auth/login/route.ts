import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { verifyPassword } from '@/lib/auth/passwords';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import logger, { logAuth, logError } from '@/lib/logger';
import { AuditLogger, getClientInfo } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, // Generic error to prevent user enumeration
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      logger.warn('Login attempt with incorrect password', { 
        userId: user.id,
        email: user.email,
      });

      // Log failed login attempt
      const { ipAddress, userAgent } = getClientInfo(request);
      await AuditLogger.logAuth(
        'login_failed',
        user.id,
        `${user.firstName} ${user.lastName}`,
        user.email,
        ipAddress,
        userAgent,
        { reason: 'invalid_password' }
      );

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if email is verified (only for members, staff can login without verification)
    if (user.role === 'MEMBER' && !user.emailVerified) {
      logger.warn('Login attempt with unverified email', { 
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json(
        { 
          error: 'Email not verified',
          needsVerification: true,
          email: user.email,
          redirectUrl: `/verify-email?email=${encodeURIComponent(user.email)}`,
        },
        { status: 403 }
      );
    }

    // Check if password has been properly set (security: prevents login with placeholder password)
    if (user.role === 'MEMBER' && user.passwordSet === false) {
      logger.warn('Login attempt with unset password', { 
        userId: user.id,
        email: user.email,
      });

      return NextResponse.json(
        { 
          error: 'Please complete email verification to set your password',
          needsVerification: true,
          email: user.email,
          redirectUrl: `/verify-email?email=${encodeURIComponent(user.email)}`,
        },
        { status: 403 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id, user.email, user.role);
    
    console.log('🔐 Session created:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionToken: sessionToken.substring(0, 20) + '...',
    });

    logger.info('✅ User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logAuth('LOGIN', user.id, {
      email: user.email,
      role: user.role,
    });

    // Log successful login
    const { ipAddress, userAgent } = getClientInfo(request);
    await AuditLogger.logAuth(
      'login',
      user.id,
      `${user.firstName} ${user.lastName}`,
      user.email,
      ipAddress,
      userAgent,
      { role: user.role, sessionCreated: true }
    );

    // Determine redirect based on role
    const redirectMap: Record<string, string> = {
      MEMBER: '/dashboard/member',
      RECEPTIONIST: '/admin/dashboard',
      MANAGER: '/admin/dashboard',
      ADMIN: '/admin/dashboard',
    };

    const redirectUrl = redirectMap[user.role] || '/dashboard/member';

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        redirectUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    logError(error as Error, { context: 'login' });
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
