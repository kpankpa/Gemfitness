import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Check Email / Phone Availability
 * Called before signup to prevent duplicate registrations.
 *
 * GET /api/auth/check-availability?email=xxx&phone=xxx
 * Returns 200 { available: true } or 409 { available: false, field: 'email'|'phone', message }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase().trim();
    const phone = searchParams.get('phone')?.trim();

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'At least one of email or phone is required' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            available: false,
            field: 'email',
            message: 'An account with this email address already exists. Please log in.',
          },
          { status: 409 }
        );
      }
    }

    // Check phone uniqueness
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone },
        select: { id: true },
      });

      if (existingPhone) {
        return NextResponse.json(
          {
            available: false,
            field: 'phone',
            message: 'This phone number is already registered to an account. Please use a different number or log in.',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Unable to verify availability. Please try again.' },
      { status: 500 }
    );
  }
}
