import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

const REQUIRED_QUESTIONS = [
  'heartCondition',
  'chestPain',
  'chestPainRest',
  'lossOfBalance',
  'boneJoint',
  'medication',
  'otherReason',
] as const;

const parqSubmissionSchema = z.object({
  responses: z.record(z.string(), z.boolean()).refine(
    (data) => {
      // All 7 required questions must be answered
      return REQUIRED_QUESTIONS.every(q => typeof data[q] === 'boolean');
    },
    { message: 'All PAR-Q questions must be answered' }
  ),
  otherReasonDetails: z.string().max(1000).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  completedAt: z.string().datetime(),
});

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

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validation = parqSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid PAR-Q submission', 
          details: validation.error.issues.map((e: { message: string }) => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { responses, otherReasonDetails, riskLevel, completedAt } = validation.data;

    // Validate otherReasonDetails is provided when otherReason is true
    if (responses.otherReason === true) {
      if (!otherReasonDetails || otherReasonDetails.trim().length === 0) {
        return NextResponse.json(
          { error: 'Please provide details for other health reasons' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate submissions (prevent spam)
    const recentSubmission = await prisma.parQResponse.findFirst({
      where: {
        userId: session.userId,
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    });

    if (recentSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted a PAR-Q within the last 24 hours. Please contact staff if you need to update your responses.' },
        { status: 409 }
      );
    }

    // Sanitize otherReasonDetails
    const sanitizedDetails = otherReasonDetails?.trim() || null;

    // Save PAR-Q response to database
    const parqResponse = await prisma.parQResponse.create({
      data: {
        userId: session.userId,
        responses: JSON.stringify(responses),
        otherReasonDetails: sanitizedDetails,
        riskLevel,
        completedAt: new Date(completedAt),
      },
    });

    // Update user record to mark PAR-Q as completed
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        parqCompleted: true,
        parqCompletedAt: new Date(completedAt),
        parqRiskLevel: riskLevel,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // If medium or high risk, create notification for staff review
    if (riskLevel === 'medium' || riskLevel === 'high') {
      try {
        await prisma.notification.create({
          data: {
            userId: session.userId,
            type: 'PAYMENT_SUCCESS', // Using existing enum, ideally should add PARQ_ALERT
            subject: `${riskLevel.toUpperCase()} Risk PAR-Q Submitted`,
            message: `${user.firstName} ${user.lastName} (${user.email}) has submitted a PAR-Q with ${riskLevel} risk level. Please review their responses and provide appropriate guidance.`,
            status: 'pending',
          },
        });
      } catch (notificationError) {
        // Log but don't fail the request if notification creation fails
        console.error('Failed to create staff notification:', notificationError);
      }
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
