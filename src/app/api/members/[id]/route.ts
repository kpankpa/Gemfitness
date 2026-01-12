/**
 * SINGLE MEMBER API
 * 
 * Endpoints:
 * - GET /api/members/[id] - Fetch single member details
 * - PUT /api/members/[id] - Update member details
 * 
 * Used by: Admin Dashboard
 * Purpose: Individual member operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isAdminOrManager } from '@/lib/auth/permissions';
import { verifySessionForApi } from '@/lib/auth/dal';
import { processMemberImage, ImageValidationError } from '../../../../lib/image/processor';

// Validation schema for updating member
const updateMemberSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(200).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().max(15).optional(),
  fitnessGoals: z.string().max(500).optional(),
  medicalConditions: z.string().max(500).optional(),
});

// GET /api/members/[id] - Fetch single member
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || session.userId === null || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin/manager to view member details
    if (!isAdminOrManager(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const member = await prisma.user.findFirst({
      where: { 
        id,
        role: 'MEMBER'
      },
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Fetch member error:', error);
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

// PUT /api/members/[id] - Update member details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || session.userId === null || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin/manager to update member details
    if (!isAdminOrManager(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Parse body: support multipart/form-data (file uploads) or JSON
    let body: unknown;
    let profileFile: File | null = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = {} as Record<string, string>;
      for (const [k, v] of form.entries()) {
        if (k === 'profileImage' && v instanceof File) profileFile = v;
        else (body as Record<string, string>)[k] = String(v);
      }
    } else {
      body = await request.json();
    }

    // Validate input
    const validatedData = updateMemberSchema.parse(body);

    // Save profile image file if provided
    try {
      if (profileFile) {
        const arrayBuffer = await profileFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        try {
          const { imagePath } = await processMemberImage(buffer, profileFile.name || 'upload', id);
          (validatedData as Partial<Record<string, unknown>>).profileImage = imagePath;
        } catch (err: unknown) {
          if (err instanceof ImageValidationError) {
            return NextResponse.json({ error: 'Invalid image upload', code: err.code, message: err.message }, { status: 400 });
          }
          console.warn('Failed to save profile image:', err);
        }
      }
    } catch (err: unknown) {
      console.warn('Failed to save profile image:', err);
    }

    // Check if member exists
    const existingMember = await prisma.user.findFirst({
      where: { 
        id,
        role: 'MEMBER'
      }
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Update member (handle unique constraint via Prisma)
    let updatedMember;
    try {
      // Build update data object conditionally to handle exactOptionalPropertyTypes
      const updateData: any = {};
      if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName;
      if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName;
      if (validatedData.email !== undefined) updateData.email = validatedData.email;
      if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
      if (validatedData.dateOfBirth !== undefined) updateData.dateOfBirth = validatedData.dateOfBirth;
      if (validatedData.address !== undefined) updateData.address = validatedData.address;
      if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact;
      if (validatedData.emergencyPhone !== undefined) updateData.emergencyPhone = validatedData.emergencyPhone;
      if (validatedData.fitnessGoals !== undefined) updateData.fitnessGoals = validatedData.fitnessGoals;
      if (validatedData.medicalConditions !== undefined) updateData.medicalConditions = validatedData.medicalConditions;
      const profileImage = (validatedData as Partial<Record<string, unknown>>).profileImage as string | undefined;
      if (profileImage !== undefined) updateData.profileImage = profileImage;

      updatedMember = await prisma.user.update({
        where: { id },
        data: updateData
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta && (err.meta.target || err.meta['target'])) || null;
        return NextResponse.json({ error: 'Unique constraint failed', fields: target }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ 
      success: true, 
      member: updatedMember,
      message: 'Member updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/members/[id] - Delete member (admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || session.userId === null || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminOrManager(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Ensure target is a member
    const existing = await prisma.user.findUnique({
      where: { id }
    });

    if (!existing || existing.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
