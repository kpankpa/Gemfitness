import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { isAdminOrManager, isAdmin } from '@/lib/auth/permissions';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

// GET /api/staff - List all staff members
export async function GET(req: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and MANAGER can view staff
    if (!isAdminOrManager(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role'); // Filter by role (RECEPTIONIST, MANAGER)

    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: roleParam 
        ? (roleParam as Prisma.EnumUserRoleFilter)
        : {
            in: ['RECEPTIONIST', 'MANAGER', 'ADMIN'],
          },
    };

    // Fetch staff members
    const staff = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            checkIns: true, // Count check-ins processed by this staff member (if logged)
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedStaff = staff.map((member) => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      profileImage: member.profileImage,
      status: 'ACTIVE', // We don't have a status field, assuming all are active
      joinDate: member.createdAt.toISOString().split('T')[0],
      lastActive: member.updatedAt.toISOString(),
      actionsCount: member._count.checkIns,
    }));

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
      count: formattedStaff.length,
    });
  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff members' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create new staff member
export async function POST(req: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can create staff
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      dateOfBirth,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['RECEPTIONIST', 'MANAGER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be RECEPTIONIST or MANAGER' },
        { status: 400 }
      );
    }

    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email or phone already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff member
    const staff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('2000-01-01'),
        emergencyContact: 'N/A',
        emergencyPhone: phone,
        registrationType: 'ADMIN',
        registrationPaid: true, // Staff don't pay registration
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        joinDate: staff.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('❌ Error creating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
