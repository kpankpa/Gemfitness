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
import { getSession } from '@/lib/auth/session';
import { isAdminOrManager } from '@/lib/auth/permissions';
import { z } from 'zod';

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
    const session = await getSession();
    if (!session || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow staff to view member details
    if (!isAdminOrManager({ ...session, isAuth: true })) {
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
    const session = await getSession();
    if (!session || session.role === 'MEMBER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin/manager to update member details
    if (!isAdminOrManager({ ...session, isAuth: true })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = updateMemberSchema.parse(body);

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

    // Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== existingMember.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Update member
    const updatedMember = await prisma.user.update({
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
      }
    });

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
