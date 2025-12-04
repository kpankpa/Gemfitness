import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/auth/permissions';
import { createPlanSchema } from '@/lib/validation/schemas';

// GET /api/plans - List all membership plans with statistics
export async function GET() {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all plans from database
    const plans = await prisma.plan.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'INACTIVE'],
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { price: 'asc' },
      ],
    });

    // Get statistics for each plan from subscriptions
    const planStats = await prisma.subscription.groupBy({
      by: ['plan'],
      where: {
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Merge stats with plan details
    const plansWithStats = plans.map((plan) => {
      const stats = planStats.find((s: { plan: string }) => s.plan === plan.slug);
      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        duration: `${plan.duration} ${plan.durationUnit}`,
        price: plan.price,
        currency: plan.currency,
        description: plan.description || '',
        features: plan.features,
        status: plan.status,
        popular: plan.isPopular,
        featured: plan.isFeatured,
        activeMembers: stats?._count.id || 0,
        totalRevenue: stats?._sum.amount || 0,
        displayOrder: plan.displayOrder,
      };
    });

    return NextResponse.json({
      success: true,
      plans: plansWithStats,
    });
  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

// POST /api/plans - Create new custom plan
export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can create plans
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();

    // Validate input with Zod
    const validation = createPlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      price,
      duration,
      durationUnit,
      features,
      isPopular,
      isFeatured,
      displayOrder,
    } = validation.data;

    // Check if plan with same name or slug exists
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan with this name or slug already exists' },
        { status: 409 }
      );
    }

    // Create new plan
    const newPlan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        price,
        duration,
        durationUnit,
        features,
        isPopular,
        isFeatured,
        displayOrder,
        createdBy: session.userId!,
      },
    });

    // Log creation in change history
    await prisma.planChangeHistory.create({
      data: {
        planId: newPlan.id,
        changedBy: session.userId!,
        changeType: 'CREATED',
        newValue: JSON.stringify(newPlan),
        description: `Plan "${name}" created`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Plan created successfully',
      plan: newPlan,
    });
  } catch (error) {
    console.error('❌ Error creating plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
