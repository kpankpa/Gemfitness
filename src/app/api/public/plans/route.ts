/**
 * Public Plans API - Serves plan data for landing pages
 * GET /api/public/plans - No authentication required for public display
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ENHANCED_PLAN_TEMPLATES, calculateSavings } from '@/lib/plans/enhanced-features';

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

    // Get subscription statistics for each plan
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

    // Merge database plans with enhanced templates
    const enhancedPlans = dbPlans.map((dbPlan) => {
      const template = ENHANCED_PLAN_TEMPLATES.find(t => t.slug === dbPlan.slug);
      const stats = planStats.find(s => s.plan === dbPlan.slug);
      
      if (!template) {
        // Fallback for plans not in templates
        return {
          id: dbPlan.id,
          name: dbPlan.name,
          slug: dbPlan.slug,
          description: dbPlan.description || 'Great value membership plan',
          price: dbPlan.price,
          duration: dbPlan.duration,
          durationUnit: dbPlan.durationUnit,
          isPopular: dbPlan.isPopular,
          isFeatured: dbPlan.isFeatured,
          features: dbPlan.features,
          memberCount: stats?._count.id || 0,
          totalRevenue: Number(stats?._sum.amount || 0),
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
        memberCount: stats?._count.id || 0,
        totalRevenue: Number(stats?._sum.amount || 0),
        annualSavings: calculateSavings({
          ...template,
          price: dbPlan.price,
          duration: dbPlan.duration,
          durationUnit: dbPlan.durationUnit as 'days' | 'months' | 'years'
        }),
        // Add real testimonials when available
        testimonials: template.testimonials?.map(t => ({
          ...t,
          // Could be enhanced with real member data later
        }))
      };
    });

    // Calculate plan comparison data
    const monthlyPlan = enhancedPlans.find(p => p.slug === 'ONE_MONTH');

    const planComparisons = enhancedPlans.map(plan => {
      let savings = 0;
      let comparisonText = '';
      
      if (monthlyPlan && plan.slug !== 'ONE_MONTH') {
        const monthlyTotal = monthlyPlan.price * (plan.durationUnit === 'months' ? plan.duration : plan.duration * 12);
        savings = monthlyTotal - plan.price;
        comparisonText = `Save GH₵${savings} vs monthly payments`;
      }
      
      return {
        ...plan,
        savings,
        comparisonText
      };
    });

    // Get gym statistics for social proof
    const totalMembers = await prisma.user.count({
      where: {
        subscriptions: {
          some: {
            status: 'ACTIVE'
          }
        }
      }
    });

    const totalCheckIns = await prisma.checkIn.count({
      where: {
        checkInTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return NextResponse.json({
      success: true,
      plans: planComparisons,
      gymStats: {
        totalActiveMembers: totalMembers,
        monthlyCheckIns: totalCheckIns,
        planVariety: enhancedPlans.length,
        // Add more social proof stats
        establishedYear: 2024, // Update with actual year
        totalClasses: 50, // Could be fetched from classes table
        certifiedTrainers: 8 // Could be fetched from staff table
      },
      // Featured benefits for homepage hero
      featuredBenefits: [
        {
          icon: 'clock',
          title: 'Flexible Hours',
          description: 'Open early mornings to late nights, 7 days a week'
        },
        {
          icon: 'users',
          title: 'Expert Training',
          description: 'Certified trainers and personalized fitness plans'
        },
        {
          icon: 'heart',
          title: 'Complete Wellness',
          description: 'Fitness, nutrition, and health services in one place'
        },
        {
          icon: 'trophy',
          title: 'Results Driven',
          description: 'Track your progress and celebrate achievements'
        }
      ],
      // Success stories for social proof
      successStories: [
        {
          name: 'Sarah M.',
          achievement: 'Lost 20kg in 6 months',
          plan: 'Quarterly Commitment',
          quote: 'The support and community here changed my life completely.'
        },
        {
          name: 'John K.',
          achievement: 'Completed first marathon',
          plan: 'Annual Champion',
          quote: 'From couch to marathon - Gemfitness made it possible.'
        },
        {
          name: 'Grace A.',
          achievement: 'Gained strength & confidence',
          plan: 'Monthly Essential',
          quote: 'I love how welcoming everyone is. Perfect place to start my fitness journey.'
        }
      ]
    });

  } catch (error) {
    console.error('❌ Error fetching public plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}