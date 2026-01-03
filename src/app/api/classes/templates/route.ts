import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';

// GET /api/classes/templates - Get all class templates
export async function GET() {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templates = await prisma.classTemplate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/classes/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      classId,
      type,
      instructor,
      duration,
      maxCapacity,
      schedule,
      color,
    } = body;

    // Validation
    if (!name || !type || !instructor || !duration || !maxCapacity || !schedule) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = await prisma.classTemplate.create({
      data: {
        name,
        description,
        classId,
        type,
        instructor,
        duration: parseInt(duration),
        maxCapacity: parseInt(maxCapacity),
        schedule,
        color,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
