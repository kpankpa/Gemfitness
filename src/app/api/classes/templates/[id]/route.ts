import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// POST /api/classes/templates/[id]/use - Create class from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: templateId } = await params;
    const body = await request.json();
    const { name, schedule } = body; // Allow overriding name and schedule

    // Get template
    const template = await prisma.classTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create class from template
    const newClass = await prisma.class.create({
      data: {
        name: name || template.name,
        description: template.description,
        type: template.type,
        instructor: template.instructor,
        duration: template.duration,
        maxCapacity: template.maxCapacity,
        schedule: schedule || template.schedule,
        color: template.color,
        status: 'ACTIVE',
        createdBy: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Class created from template successfully',
      class: newClass,
    });
  } catch (error) {
    console.error('Error creating class from template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create class from template' },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: templateId } = await params;

    await prisma.classTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
