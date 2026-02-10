import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { suggestTrainerForClass } from '@/lib/services/scheduling/trainer-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/trainers/suggest
 * Suggest best trainer for a class based on criteria
 * 
 * Body:
 * {
 *   classType: string,    // e.g., "HIIT", "Yoga", "Strength Training"
 *   schedule: string,     // e.g., "Monday, Wednesday 9:00 AM - 10:00 AM"
 *   duration: number      // in minutes
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can get trainer suggestions
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { classType, schedule, duration } = body;

    // Validation
    if (!classType || !schedule || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields: classType, schedule, duration' },
        { status: 400 }
      );
    }

    const suggestions = await suggestTrainerForClass({
      classType,
      schedule,
      duration: Number(duration),
    });

    // Return top 5 suggestions
    const topSuggestions = suggestions.slice(0, 5);

    return NextResponse.json({
      success: true,
      suggestions: topSuggestions.map(s => ({
        trainer: {
          id: s.trainer.id,
          name: s.trainer.name,
          specializations: s.trainer.specializations,
          currentWeeklyHours: s.trainer.currentWeeklyHours,
          maxWeeklyHours: s.trainer.maxWeeklyHours,
          image: s.trainer.image,
        },
        score: s.score,
        reasons: s.reasons,
        warnings: s.warnings,
        recommended: s.score >= 60 && s.warnings.length === 0,
      })),
      totalTrainers: suggestions.length,
    });
  } catch (error) {
    console.error('Error suggesting trainer:', error);
    return NextResponse.json(
      { error: 'Failed to suggest trainer' },
      { status: 500 }
    );
  }
}
