import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

const questionIds = [
  'heartCondition',
  'chestPain',
  'chestPainRest',
  'lossOfBalance',
  'boneJoint',
  'medication',
  'otherReason',
] as const;

type QuestionId = (typeof questionIds)[number];

type ResponsesMap = Record<QuestionId, boolean>;

const parqUpdateSchema = z.object({
  responses: z.record(z.string(), z.boolean()),
  otherReasonDetails: z.string().max(1000).optional(),
  completedAt: z.string().optional(),
});

const calculateRiskLevel = (responses: ResponsesMap): 'low' | 'medium' | 'high' => {
  const yesCount = Object.values(responses).filter(Boolean).length;
  if (yesCount === 0) return 'low';
  if (yesCount <= 2) return 'medium';
  return 'high';
};

const normalizeResponses = (input: Record<string, boolean>): ResponsesMap => {
  const normalized = {} as ResponsesMap;
  for (const id of questionIds) {
    normalized[id] = input[id] === true;
  }
  return normalized;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth || !['ADMIN', 'MANAGER'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const [user, latestResponse] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          parqCompleted: true,
          parqCompletedAt: true,
          parqRiskLevel: true,
        },
      }),
      prisma.parQResponse.findFirst({
        where: { userId },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (!latestResponse) {
      return NextResponse.json({
        success: true,
        data: {
          user,
          response: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        response: {
          id: latestResponse.id,
          responses: JSON.parse(latestResponse.responses),
          otherReasonDetails: latestResponse.otherReasonDetails,
          riskLevel: latestResponse.riskLevel,
          completedAt: latestResponse.completedAt,
        },
      },
    });
  } catch (error) {
    console.error('Admin PAR-Q fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch PAR-Q data' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth || !['ADMIN', 'MANAGER'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = parqUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const responsesRaw = validation.data.responses as Record<string, boolean>;
    const responses = normalizeResponses(responsesRaw);

    const otherReasonDetails = validation.data.otherReasonDetails?.trim() || null;
    const completedAt = validation.data.completedAt ? new Date(validation.data.completedAt) : new Date();
    const riskLevel = calculateRiskLevel(responses);

    // Validate otherReasonDetails when otherReason is true
    if (responses.otherReason === true && !otherReasonDetails) {
      return NextResponse.json(
        { error: 'Please provide details for other health reasons' },
        { status: 400 }
      );
    }

    const existingResponse = await prisma.parQResponse.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!existingResponse) {
      return NextResponse.json({ error: 'No PAR-Q response found for member' }, { status: 404 });
    }

    // Capture old values for audit log
    const oldResponses = JSON.parse(existingResponse.responses);
    const oldRiskLevel = existingResponse.riskLevel;

    const updatedResponse = await prisma.parQResponse.update({
      where: { id: existingResponse.id },
      data: {
        responses: JSON.stringify(responses),
        otherReasonDetails,
        riskLevel,
        completedAt,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        parqCompleted: true,
        parqCompletedAt: completedAt,
        parqRiskLevel: riskLevel,
      },
    });

    // Create audit log entry
    try {
      // Get session user details for audit log
      const sessionUser = await prisma.user.findUnique({
        where: { id: session.userId! },
        select: { firstName: true, lastName: true, email: true },
      });

      if (sessionUser) {
        await prisma.auditLog.create({
          data: {
            userId: session.userId!,
            userName: `${sessionUser.firstName} ${sessionUser.lastName}`,
            userEmail: sessionUser.email,
            action: 'UPDATE',
            entityType: 'PARQ',
            entityId: updatedResponse.id,
            changes: {
              targetMemberId: userId,
              oldRiskLevel,
              newRiskLevel: riskLevel,
              oldResponses,
              newResponses: responses,
              oldOtherReasonDetails: existingResponse.otherReasonDetails,
              newOtherReasonDetails: otherReasonDetails,
            },
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
      }
    } catch (auditError) {
      // Log but don't fail the request if audit logging fails
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedResponse.id,
        riskLevel: updatedResponse.riskLevel,
        completedAt: updatedResponse.completedAt,
      },
    });
  } catch (error) {
    console.error('Admin PAR-Q update error:', error);
    return NextResponse.json({ error: 'Failed to update PAR-Q data' }, { status: 500 });
  }
}
