import { NextRequest, NextResponse } from 'next/server';
import type { MembershipPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/auth/permissions';
import { updatePlanSchema } from '@/lib/validation/schemas';

// GET /api/plans/[id] - Get single plan details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        changeHistory: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Get subscription stats for this plan
    const stats = await prisma.subscription.groupBy({
      by: ['plan'],
      where: {
        plan: plan.slug as MembershipPlan, 
        status: 'ACTIVE',
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    const planStats = stats[0];

    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        activeMembers: planStats?._count?.id || 0,
        totalRevenue: planStats?._sum?.amount || 0,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id] - Update plan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can update plans
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate input with Zod
    const validation = updatePlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Get existing plan
    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    const {
      name,
      description,
      price,
      duration,
      durationUnit,
      features,
      isPopular,
      isFeatured,
      displayOrder,
      status,
    } = validation.data;

    // Track changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    let changeDescription = '';

    if (price !== undefined && price !== existingPlan.price) {
      changes.price = { old: existingPlan.price, new: price };
      changeDescription += `Price changed from ${existingPlan.currency} ${existingPlan.price} to ${existingPlan.currency} ${price}. `;
    }

    if (name && name !== existingPlan.name) {
      changes.name = { old: existingPlan.name, new: name };
      changeDescription += `Name changed from "${existingPlan.name}" to "${name}". `;
    }

    if (status && status !== existingPlan.status) {
      changes.status = { old: existingPlan.status, new: status };
      changeDescription += `Status changed from ${existingPlan.status} to ${status}. `;
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (durationUnit !== undefined) updateData.durationUnit = durationUnit;
    if (features !== undefined) updateData.features = features;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (status !== undefined) updateData.status = status;

    // Update plan
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Log changes only if meaningful changes occurred
    if (Object.keys(changes).length > 0 && changeDescription) {
      await prisma.planChangeHistory.create({
        data: {
          planId: id,
          changedBy: session.userId!,
          changeType: changes.status ? 'STATUS_CHANGED' : changes.price ? 'PRICE_CHANGED' : 'UPDATED',
          oldValue: JSON.stringify(changes),
          newValue: JSON.stringify(updateData),
          description: changeDescription.trim(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Plan updated successfully',
      plan: updatedPlan,
    });
  } catch (error) {
    console.error('❌ Error updating plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Archive plan (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete plans
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id } = await params;

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Check if there are active subscriptions using this plan
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        plan: plan.slug as MembershipPlan, // Cast string slug to enum
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete plan with ${activeSubscriptions} active subscriptions. Set to INACTIVE instead.` 
        },
        { status: 400 }
      );
    }

    // Archive the plan (soft delete)
    await prisma.plan.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    // Log change
    await prisma.planChangeHistory.create({
      data: {
        planId: id,
        changedBy: session.userId!,
        changeType: 'STATUS_CHANGED',
        oldValue: JSON.stringify({ status: plan.status }),
        newValue: JSON.stringify({ status: 'ARCHIVED' }),
        description: `Plan "${plan.name}" archived`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan archived successfully',
    });
  } catch (error) {
    console.error('❌ Error archiving plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive plan' },
      { status: 500 }
    );
  }
}
