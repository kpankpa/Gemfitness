import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/auth/permissions';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

// GET /api/staff/[id] - Get single staff member details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionForApi();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.role || !['ADMIN', 'MANAGER'].includes(session.role as string)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const staff = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        address: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            checkIns: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Make sure it's actually a staff member
    if (!['RECEPTIONIST', 'MANAGER', 'ADMIN'].includes(staff.role)) {
      return NextResponse.json(
        { success: false, error: 'Not a staff member' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        dateOfBirth: staff.dateOfBirth.toISOString().split('T')[0],
        address: staff.address,
        profileImage: staff.profileImage,
        joinDate: staff.createdAt.toISOString().split('T')[0],
        lastActive: staff.updatedAt.toISOString(),
        actionsCount: staff._count.checkIns,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching staff member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff member' },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can update staff
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      password,
      dateOfBirth,
      address,
    } = body;

    // Check if staff exists
    const existingStaff = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (!['RECEPTIONIST', 'MANAGER', 'ADMIN'].includes(existingStaff.role)) {
      return NextResponse.json(
        { success: false, error: 'Not a staff member' },
        { status: 404 }
      );
    }

    // Validate role if provided
    if (role && !['RECEPTIONIST', 'MANAGER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check email/phone uniqueness if changed
    if (email && email !== existingStaff.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    if (phone && phone !== existingStaff.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone already in use' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role as Prisma.EnumUserRoleFieldUpdateOperationsInput;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (address !== undefined) updateData.address = address;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update staff
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: {
        id: updatedStaff.id,
        name: `${updatedStaff.firstName} ${updatedStaff.lastName}`,
        email: updatedStaff.email,
        phone: updatedStaff.phone,
        role: updatedStaff.role,
        joinDate: updatedStaff.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('❌ Error updating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete staff
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { id } = params;

    // Check if staff exists
    const staff = await prisma.user.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (!['RECEPTIONIST', 'MANAGER', 'ADMIN'].includes(staff.role)) {
      return NextResponse.json(
        { success: false, error: 'Not a staff member' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (staff.id === session.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete staff member
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
