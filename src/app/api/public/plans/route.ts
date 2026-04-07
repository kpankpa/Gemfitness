/**
 * Public Plans API - Serves plan data for landing pages
 * GET /api/public/plans - No authentication required for public display
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ENHANCED_PLAN_TEMPLATES } from '@/lib/plans/enhanced-features';

export async function GET() {
  try {
    // Get active plans from database
    const dbPlans = await prisma.plan.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [
        { displayOrder: 'asc' },
        { price: 'asc' },
      ],
    });

    // Merge database plans with enhanced templates
    const enhancedPlans = dbPlans.map((dbPlan) => {
      const template = ENHANCED_PLAN_TEMPLATES.find(t => t.slug === dbPlan.slug);
      
      if (!template) {
        // Fallback for plans not in templates
        return {
          id: dbPlan.id,
          name: dbPlan.name,
          slug: dbPlan.slug,
          description: dbPlan.description || 'Great value membership plan',
          price: dbPlan.price,
          originalPrice: undefined,
          duration: dbPlan.duration,
          durationUnit: dbPlan.durationUnit,
          isPopular: dbPlan.isPopular,
          isFeatured: dbPlan.isFeatured,
          features: dbPlan.features,
          categorizedFeatures: undefined,
          valuePropositions: [
            `${dbPlan.duration} ${dbPlan.durationUnit} commitment`,
            'Access to all gym facilities',
            'Professional fitness support'
          ],
          targetAudience: 'Fitness enthusiasts'
        };
      }

      return {
        ...template,
        id: dbPlan.id,
        price: dbPlan.price,
        duration: dbPlan.duration,
        durationUnit: dbPlan.durationUnit,
        isPopular: dbPlan.isPopular,
        isFeatured: dbPlan.isFeatured,
        features: dbPlan.features,
      };
    });

    return NextResponse.json({
      success: true,
      plans: enhancedPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price,
        originalPrice: plan.originalPrice,
        duration: plan.duration,
        durationUnit: plan.durationUnit,
        isPopular: plan.isPopular,
        isFeatured: plan.isFeatured,
        features: plan.features,
        categorizedFeatures: plan.categorizedFeatures,
        valuePropositions: plan.valuePropositions,
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching public plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}