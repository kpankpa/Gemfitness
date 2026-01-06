import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { ParQSubmission } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body: ParQSubmission = await request.json();
    const { responses, otherReasonDetails, riskLevel, completedAt } = body;

    // Validate required fields
    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Invalid PAR-Q responses' },
        { status: 400 }
      );
    }

    if (!riskLevel || !['low', 'medium', 'high'].includes(riskLevel)) {
      return NextResponse.json(
        { error: 'Invalid risk level' },
        { status: 400 }
      );
    }

    // Save PAR-Q response to database
    const parqResponse = await prisma.parQResponse.create({
      data: {
        userId: session.userId,
        responses: JSON.stringify(responses),
        otherReasonDetails: otherReasonDetails || null,
        riskLevel,
        completedAt: new Date(completedAt),
      },
    });

    // Update user record to mark PAR-Q as completed
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        parqCompleted: true,
        parqCompletedAt: new Date(completedAt),
        parqRiskLevel: riskLevel,
      },
    });

    // If high risk, notify staff (future implementation)
    if (riskLevel === 'high') {
      // TODO: Send notification to staff
      // await sendStaffNotification({
      //   userId: session.userId,
      //   message: 'High-risk PAR-Q response requires review',
      //   priority: 'high'
      // });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'PAR-Q submitted successfully',
        data: {
          id: parqResponse.id,
          riskLevel,
          needsStaffReview: riskLevel === 'high',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('PAR-Q submission error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to submit PAR-Q',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verify user session
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user's PAR-Q history
    const parqResponses = await prisma.parQResponse.findMany({
      where: {
        userId: session.userId,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Get user's PAR-Q status
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        parqCompleted: true,
        parqCompletedAt: true,
        parqRiskLevel: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          status: user,
          history: parqResponses.map((response: { id: string; responses: string; otherReasonDetails: string | null; riskLevel: string; completedAt: Date }) => ({
            id: response.id,
            responses: JSON.parse(response.responses as string),
            otherReasonDetails: response.otherReasonDetails,
            riskLevel: response.riskLevel,
            completedAt: response.completedAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PAR-Q retrieval error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve PAR-Q data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
