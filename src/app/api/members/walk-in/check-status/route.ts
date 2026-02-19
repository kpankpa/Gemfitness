/**
 * Check Walk-In Registration Payment Status
 * GET /api/members/walk-in/check-status?email=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/services/paystack';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking registration status for:', email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      }
    });

    if (existingUser) {
      return NextResponse.json({
        status: 'completed',
        message: 'User registration completed successfully',
        user: existingUser
      });
    }

    // Check pending registration
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
        createdAt: true,
      }
    });

    if (!pendingReg) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No pending registration found for this email'
      });
    }

    const now = new Date();
    const isExpired = pendingReg.expiresAt <= now;

    // If expired, auto-delete
    if (isExpired) {
      await prisma.pendingRegistration.delete({
        where: { id: pendingReg.id }
      });
      console.log('🗑️ Auto-deleted expired pending registration:', email);
      
      return NextResponse.json({
        status: 'expired',
        message: 'Pending registration has expired. You can register again.',
        expiredAt: pendingReg.expiresAt
      });
    }

    // Check payment status with Paystack
    let paystackStatus = null;
    if (pendingReg.paymentReference) {
      try {
        const verification = await paystackService.verifyPayment(pendingReg.paymentReference);
        if (verification.status && verification.data && 'status' in verification.data) {
          paystackStatus = {
            status: verification.data.status,
            amount: verification.data.amount / 100, // Convert from kobo to GHS
            paidAt: verification.data.paid_at,
          };
        }
      } catch (error) {
        console.warn('⚠️ Failed to verify payment with Paystack:', error);
        // Continue without Paystack status
      }
    }

    // Return pending status with details
    return NextResponse.json({
      status: 'pending',
      message: 'Mobile money payment is pending. Please complete the USSD prompt on your phone.',
      pending: {
        email: pendingReg.email,
        name: `${pendingReg.firstName} ${pendingReg.lastName}`,
        reference: pendingReg.paymentReference,
        paymentStatus: pendingReg.paymentStatus,
        expiresAt: pendingReg.expiresAt,
        createdAt: pendingReg.createdAt,
        timeRemaining: Math.max(0, Math.floor((pendingReg.expiresAt.getTime() - now.getTime()) / 1000 / 60)), // minutes
      },
      paystackStatus
    });

  } catch (error) {
    console.error('❌ Error checking registration status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check registration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
