/**
 * Cancel Pending Walk-In Registration
 * POST /api/members/walk-in/cancel
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const cancelSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    console.log('🚫 Cancel request for:', email);

    // Find pending registration
    const pendingReg = await prisma.pendingRegistration.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        paymentReference: true,
        paymentStatus: true,
        expiresAt: true,
      }
    });

    if (!pendingReg) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No pending registration found for this email'
      }, { status: 404 });
    }

    // Check if user was already created (shouldn't happen, but safety check)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Delete orphaned pending registration
      await prisma.pendingRegistration.delete({
        where: { id: pendingReg.id }
      });
      
      return NextResponse.json({
        status: 'already_completed',
        message: 'User registration was already completed. Pending record cleaned up.',
        user: {
          id: existingUser.id,
          name: `${existingUser.firstName} ${existingUser.lastName}`,
          email: existingUser.email
        }
      });
    }

    // Delete pending registration
    await prisma.pendingRegistration.delete({
      where: { id: pendingReg.id }
    });

    console.log('✅ Cancelled pending registration:', {
      email,
      reference: pendingReg.paymentReference,
      status: pendingReg.paymentStatus
    });

    return NextResponse.json({
      status: 'cancelled',
      message: 'Pending registration cancelled successfully. You can now register again.',
      cancelled: {
        email: pendingReg.email,
        name: `${pendingReg.firstName} ${pendingReg.lastName}`,
        reference: pendingReg.paymentReference,
        wasExpired: pendingReg.expiresAt <= new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling registration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
