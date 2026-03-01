import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/auth/passwords';

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Skip verification is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize the incoming email
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[skip-verification] Looking up email: "${normalizedEmail}" (raw input: "${email}")`);

    // Try Prisma ORM first (case-insensitive)
    let user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    // Fallback: raw SQL in case ORM mode:'insensitive' misses due to stored whitespace / encoding
    if (!user) {
      console.log(`[skip-verification] ORM found nothing, trying raw SQL for: "${normalizedEmail}"`);
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "users" WHERE LOWER(TRIM(email)) = LOWER(TRIM(${normalizedEmail})) LIMIT 1
      `;
      if (rows.length > 0) {
        user = await prisma.user.findUnique({ where: { id: rows[0].id } });
        console.log(`[skip-verification] Raw SQL found user id: ${rows[0].id}`);
      }
    }

    if (!user) {
      // Log all users with similar emails for diagnosis
      console.log(`[skip-verification] User not found for email: "${normalizedEmail}"`);
      return NextResponse.json(
        { error: `User not found for email: ${normalizedEmail}` },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Skip verification - mark email as verified, set password, and clear OTP
    // Use the actual password from signup if provided, otherwise fallback to dev password
    const actualPassword = password && typeof password === 'string' && password.length >= 8 
      ? password 
      : 'Dev123456!';
    const hashedPassword = await hashPassword(actualPassword);
    const usingActualPassword = actualPassword !== 'Dev123456!';
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        password: hashedPassword,
        passwordSet: true,
        otpCode: null,
        otpExpiry: null,
        otpAttempts: 0
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('🔓 EMAIL VERIFICATION SKIPPED (DEV MODE)');
    console.log('='.repeat(60));
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${usingActualPassword ? '[YOUR SIGNUP PASSWORD]' : actualPassword}`);
    console.log(`Password Source: ${usingActualPassword ? 'Actual signup password' : 'Dev fallback'}`);
    console.log('='.repeat(60) + '\n');

    logger.info('🔓 Email verification skipped (DEV MODE):', {
      email: user.email,
      userId: user.id,
      environment: process.env.NODE_ENV
    });

    return NextResponse.json({
      success: true,
      message: 'Email verification skipped successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: true
      }
    });

  } catch (error) {
    logger.error('❌ Error skipping verification:', error);
    
    return NextResponse.json(
      { error: 'Failed to skip verification. Please try again.' },
      { status: 500 }
    );
  }
}