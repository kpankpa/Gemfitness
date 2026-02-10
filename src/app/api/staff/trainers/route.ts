import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import {
  createTrainer,
  listTrainers,
} from '@/lib/services/scheduling/trainer-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/trainers
 * List all trainers with optional filtering
 * Query params: status, specialization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can view trainers
    if (!session.role || !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Staff role required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const specializationParam = searchParams.get('specialization');
    
    const options: { status?: string; specialization?: string } = {};
    if (statusParam) options.status = statusParam;
    if (specializationParam) options.specialization = specializationParam;

    const trainers = await listTrainers(options);

    return NextResponse.json({
      success: true,
      trainers,
      total: trainers.length,
    });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/trainers
 * Create a new trainer
 * Requires MANAGER or ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can create trainers
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      specializations,
      bio,
      image,
      certifications,
      maxWeeklyHours,
      preferredDays,
      preferredTimes,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Trainer name is required' },
        { status: 400 }
      );
    }

    const trainer = await createTrainer({
      name,
      email,
      phone,
      specializations: specializations || [],
      bio,
      image,
      certifications: certifications || [],
      maxWeeklyHours: maxWeeklyHours || 40,
      preferredDays: preferredDays || [],
      preferredTimes: preferredTimes || [],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Trainer created successfully',
        trainer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating trainer:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A trainer with this name or email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create trainer' },
      { status: 500 }
    );
  }
}
