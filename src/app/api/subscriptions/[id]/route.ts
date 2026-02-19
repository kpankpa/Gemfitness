/**
 * Subscription Management API
 * 
 * Endpoints:
 * - GET  /api/subscriptions/[id] - Get subscription details
 * - POST /api/subscriptions/[id]/renew - Renew subscription
 * - POST /api/subscriptions/[id]/upgrade - Upgrade plan
 * - POST /api/subscriptions/[id]/downgrade - Downgrade plan
 * - POST /api/subscriptions/[id]/pause - Pause subscription
 * - POST /api/subscriptions/[id]/resume - Resume subscription
 * - POST /api/subscriptions/[id]/payment-method - Update payment method
 * - GET  /api/subscriptions/[id]/history - Get change history
 * - GET  /api/subscriptions/[id]/renewal-status - Get renewal status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { MembershipPlan } from '@/lib/pricing';
import { verifySessionForApi } from '@/lib/auth/dal';
import { 
  manualRenewalRequest,
  updatePaymentMethod 
} from '@/lib/services/subscription/renewal-service';
import {
  upgradePlan,
  downgradePlan,
  previewPlanChange
} from '@/lib/services/subscription/upgrade-downgrade-service';
import {
  pauseSubscription,
  resumeSubscription,
  getDaysUntilResume
} from '@/lib/services/subscription/pause-resume-service';

interface SessionInfo {
  isAuth: boolean;
  userId: string | null;
  role: string | null;
}

// GET /api/subscriptions/[id] - Get subscription details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: subscriptionId } = await params;
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        renewalHistory: { take: 5, orderBy: { attemptedAt: 'desc' } },
        changeHistory: { take: 10, orderBy: { appliedAt: 'desc' } }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check authorization
    if (subscription.userId !== session.userId) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Calculate days until expiry
    const now = new Date();
    const daysUntilExpiry = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        daysUntilExpiry,
        daysUntilResume: getDaysUntilResume(subscription) || null
      }
    });
  } catch (error) {
    logger.error('Get subscription error:', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscriptions/[id]/renew - Renew subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const resolvedParams = await params;
    const subscriptionId = resolvedParams.id;

    if (action === 'renew') {
      return handleRenewal(request, subscriptionId, session);
    } else if (action === 'upgrade') {
      return handleUpgrade(request, subscriptionId, session);
    } else if (action === 'downgrade') {
      return handleDowngrade(request, subscriptionId, session);
    } else if (action === 'pause') {
      return handlePause(request, subscriptionId, session);
    } else if (action === 'resume') {
      return handleResume(request, subscriptionId, session);
    } else if (action === 'payment-method') {
      return handleUpdatePaymentMethod(request, subscriptionId, session);
    } else if (action === 'preview-upgrade') {
      return handlePreviewUpgrade(request, subscriptionId, session);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Subscription action error:', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleRenewal(_request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const result = await manualRenewalRequest(subscriptionId, session.userId!);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handleUpgrade(request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const body = await request.json().catch(() => ({}));
  
  const schema = z.object({
    newPlan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
    reason: z.string().optional()
  });

  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { newPlan, reason } = validationResult.data;
  const result = await upgradePlan(subscriptionId, newPlan as MembershipPlan, session.userId!, reason);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handleDowngrade(request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const body = await request.json().catch(() => ({}));

  const schema = z.object({
    newPlan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
    reason: z.string().optional()
  });

  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { newPlan, reason } = validationResult.data;
  const result = await downgradePlan(subscriptionId, newPlan as MembershipPlan, session.userId!, reason);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handlePause(request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const body = await request.json().catch(() => ({}));

  const schema = z.object({
    resumeDate: z.string().optional(),
    reason: z.string().optional()
  });

  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { resumeDate, reason } = validationResult.data;
  const result = await pauseSubscription(
    subscriptionId,
    session.userId!,
    resumeDate ? new Date(resumeDate) : undefined,
    reason
  );

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handleResume(_request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const result = await resumeSubscription(subscriptionId, session.userId!);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handleUpdatePaymentMethod(request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const body = await request.json().catch(() => ({}));

  const schema = z.object({
    authorizationCode: z.string().min(1)
  });

  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { authorizationCode } = validationResult.data;
  const result = await updatePaymentMethod(subscriptionId, authorizationCode, session.userId!);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

async function handlePreviewUpgrade(request: NextRequest, subscriptionId: string, session: SessionInfo) {
  const body = await request.json().catch(() => ({}));

  const schema = z.object({
    newPlan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR'])
  });

  const validationResult = schema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { newPlan } = validationResult.data;

  // Get current subscription
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  // Check authorization
  if (subscription.userId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const preview = previewPlanChange(subscription.plan as MembershipPlan, newPlan as MembershipPlan, subscription.endDate);

  return NextResponse.json({
    success: true,
    preview
  });
}

export const dynamic = 'force-dynamic';
