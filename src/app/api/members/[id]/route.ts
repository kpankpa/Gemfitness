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
import { prisma } from '@/lib/prisma';
import { isAdminOrManager } from '@/lib/auth/permissions';
import { verifySessionForApi } from '@/lib/auth/dal';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const member = await prisma.user.findUnique({
      where: { 
        id: params.id,
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
  { params }: { params: { id: string } }
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

    // Parse body: support multipart/form-data (file uploads) or JSON
    let body: any;
    let profileFile: any = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = {} as any;
      for (const [k, v] of form.entries()) {
        if (k === 'profileImage') profileFile = v;
        else body[k] = String(v);
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
        const mime = profileFile.type || '';
        let ext = 'jpg';
        if (mime && mime.includes('/')) ext = mime.split('/')[1];
        const origName = (profileFile as any).name;
        if ((!ext || ext === 'octet-stream') && origName) {
          const m = origName.match(/\.([a-zA-Z0-9]+)$/);
          if (m) ext = m[1];
        }
        const fs = await import('fs');
        const path = await import('path');
        const imagesDir = path.join(process.cwd(), 'public', 'images', 'members');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        const filename = `${params.id}.${ext}`;
        const filepath = path.join(imagesDir, filename);
        fs.writeFileSync(filepath, buffer);
        (validatedData as any).profileImage = `/images/members/${filename}`;
      }
    } catch (err) {
      console.warn('Failed to save profile image:', err);
    }

    // Check if member exists
    const existingMember = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: 'MEMBER'
      }
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Update member (handle unique constraint via Prisma)
    let updatedMember;
    try {
      updatedMember = await prisma.user.update({
        where: { id: params.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
          dateOfBirth: validatedData.dateOfBirth,
          address: validatedData.address,
          emergencyContact: validatedData.emergencyContact,
          emergencyPhone: validatedData.emergencyPhone,
          fitnessGoals: validatedData.fitnessGoals,
          medicalConditions: validatedData.medicalConditions,
          profileImage: (validatedData as any).profileImage || undefined
        }
      });
    } catch (err: any) {
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionForApi();
    if (!session || session.userId === null || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminOrManager(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure target is a member
    const existing = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existing || existing.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
