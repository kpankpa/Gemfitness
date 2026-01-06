import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Check if a member has completed their PAR-Q health screening
 * Used by check-in system to verify before allowing entry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode');

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Find user by QR code
    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        parqCompleted: true,
        parqCompletedAt: true,
        parqRiskLevel: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if PAR-Q is required (not completed)
    const requiresParQ = !user.parqCompleted;

    return NextResponse.json({
      success: true,
      memberId: user.id,
      memberName: `${user.firstName} ${user.lastName}`,
      requiresParQ,
      parqCompleted: user.parqCompleted || false,
      parqCompletedAt: user.parqCompletedAt,
      parqRiskLevel: user.parqRiskLevel,
      memberSince: user.createdAt,
    });

  } catch (error) {
    console.error('PAR-Q check error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check PAR-Q status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
