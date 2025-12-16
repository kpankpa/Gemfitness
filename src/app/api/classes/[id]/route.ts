import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import { $Enums } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/classes/[id]
 * Get details of a specific class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name,
        description: classData.description,
        type: classData.type,
        instructor: classData.instructor,
        duration: classData.duration,
        maxCapacity: classData.maxCapacity,
        currentBookings: classData.currentBookings,
        enrolled: classData._count.bookings,
        schedule: classData.schedule,
        color: classData.color,
        status: classData.status,
        createdBy: classData.createdBy,
        createdAt: classData.createdAt.toISOString(),
        updatedAt: classData.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes/[id]
 * Update a class
 * Requires MANAGER or ADMIN role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      description,
      type,
      instructor,
      duration,
      maxCapacity,
      schedule,
      color,
      status
    } = body;

    const existingClass = await prisma.class.findUnique({
      where: { id }
    });

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(instructor && { instructor }),
        ...(duration && { duration: parseInt(duration) }),
        ...(maxCapacity && { maxCapacity: parseInt(maxCapacity) }),
        ...(schedule && { schedule }),
        ...(color !== undefined && { color }),
        ...(status && { status: status as $Enums.ClassStatus })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
      class: {
        id: updatedClass.id,
        name: updatedClass.name,
        description: updatedClass.description,
        type: updatedClass.type,
        instructor: updatedClass.instructor,
        duration: updatedClass.duration,
        maxCapacity: updatedClass.maxCapacity,
        schedule: updatedClass.schedule,
        color: updatedClass.color,
        status: updatedClass.status
      }
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]
 * Delete a class
 * Requires MANAGER or ADMIN role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.role || !['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Manager or Admin role required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if there are active bookings
    if (existingClass._count.bookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with existing bookings. Cancel the class instead.' },
        { status: 400 }
      );
    }

    await prisma.class.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
