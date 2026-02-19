import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromQR, validateQRCode } from '@/lib/qr/generator';

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

    // Extract token from GYM|<token> format, or use raw value as fallback
    let lookupValue = qrCode;
    if (validateQRCode(qrCode)) {
      const token = extractTokenFromQR(qrCode);
      if (token) lookupValue = token;
    }

    // Find user by QR code token
    const user = await prisma.user.findUnique({
      where: { qrCode: lookupValue },
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
