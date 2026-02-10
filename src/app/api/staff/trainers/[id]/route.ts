import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import {
  getTrainer,
  updateTrainer,
  getTrainerAvailability,
  setTrainerAvailability,
  getTrainerClasses,
  setTrainerUnavailableDates,
} from '@/lib/services/scheduling/trainer-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/trainers/[id]
 * Get trainer details, schedule, and availability
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff can view trainer details
    if (!session.role || !['MANAGER', 'ADMIN', 'RECEPTIONIST'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Staff role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const trainer = await getTrainer(id);

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    // Get additional details
    const [availability, classes] = await Promise.all([
      getTrainerAvailability(trainer.name),
      getTrainerClasses(trainer.name),
    ]);

    return NextResponse.json({
      success: true,
      trainer: {
        ...trainer,
        availability,
        classes: classes.classes,
        totalHoursPerWeek: classes.totalHoursPerWeek,
      },
    });
  } catch (error) {
    console.error('Error fetching trainer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff/trainers/[id]
 * Update trainer details
 * Requires MANAGER or ADMIN role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can update trainers
    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Manager or Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      specializations,
      bio,
      image,
      certifications,
      status,
      maxWeeklyHours,
      preferredDays,
      preferredTimes,
      availability,
      unavailableDates,
    } = body;

    const existingTrainer = await getTrainer(id);
    if (!existingTrainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    // Update main trainer data
    const updatedTrainer = await updateTrainer(id, {
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(specializations && { specializations }),
      ...(bio !== undefined && { bio }),
      ...(image !== undefined && { image }),
      ...(certifications && { certifications }),
      ...(status && { status }),
      ...(maxWeeklyHours && { maxWeeklyHours }),
      ...(preferredDays && { preferredDays }),
      ...(preferredTimes && { preferredTimes }),
    });

    // Update availability if provided
    if (availability && Array.isArray(availability)) {
      await setTrainerAvailability(updatedTrainer.name, availability);
    }

    // Update unavailable dates if provided
    if (unavailableDates && Array.isArray(unavailableDates)) {
      await setTrainerUnavailableDates(updatedTrainer.id, unavailableDates);
    }

    return NextResponse.json({
      success: true,
      message: 'Trainer updated successfully',
      trainer: updatedTrainer,
    });
  } catch (error) {
    console.error('Error updating trainer:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/trainers/[id]
 * Deactivate a trainer (soft delete)
 * Requires ADMIN role
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete/deactivate trainers
    if (!session.role || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const trainer = await getTrainer(id);

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    // Check if trainer has active classes
    const classes = await getTrainerClasses(trainer.name);
    if (classes.classes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot deactivate trainer with active classes',
          activeClasses: classes.classes.length,
        },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    await updateTrainer(id, { status: 'INACTIVE' });

    return NextResponse.json({
      success: true,
      message: 'Trainer deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating trainer:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate trainer' },
      { status: 500 }
    );
  }
}
