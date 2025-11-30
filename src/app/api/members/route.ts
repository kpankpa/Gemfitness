/**
 * ADMIN MEMBER MANAGEMENT API
 * 
 * Endpoints:
 * - GET /api/members - Fetch all members (for admin dashboard)
 * - POST /api/members - Register new member (admin registration)
 * 
 * Used by: Admin Dashboard (Receptionists & Managers)
 * Purpose: Member CRUD operations, registration, admin member management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { RegistrationType, UserRole, MembershipPlan } from '@prisma/client';
import { generateMemberQRCode } from '@/lib/qr/generator';
import type { Prisma } from '@prisma/client';

// Type for user with included relations
type UserWithSubscriptions = Prisma.UserGetPayload<{
  include: {
    subscriptions: true;
    _count: {
      select: {
        checkIns: true;
      };
    };
  };
}>;

// GET /api/members - Fetch all members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    const limit = searchParams.get('limit');
    
    const where: Prisma.UserWhereInput = { role: 'MEMBER' };
    
    if (status && status !== 'All Status') {
      const subscriptionStatus = status === 'active' ? 'ACTIVE' : 
                                 status === 'expired' ? 'EXPIRED' : 
                                 status === 'expiring_soon' ? 'ACTIVE' : undefined;
      
      if (subscriptionStatus) {
        where.subscriptions = {
          some: { 
            status: subscriptionStatus,
            ...(status === 'expiring_soon' && {
              endDate: {
                lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
              }
            })
          }
        };
      }
    }
    
    if (plan && plan !== 'All Plans') {
      const membershipPlan = plan.replace(/\s+/g, '_').toUpperCase() as MembershipPlan;
      where.subscriptions = {
        some: { plan: membershipPlan }
      };
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { 
            checkIns: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit) })
    }) as UserWithSubscriptions[];

    const formattedMembers = members.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      phone: member.phone,
      plan: member.subscriptions[0]?.plan?.replace(/_/g, ' ') || 'No Plan',
      status: member.subscriptions[0]?.status?.toLowerCase() || 'inactive',
      expiresAt: member.subscriptions[0]?.endDate?.toISOString().split('T')[0] || null,
      joinDate: member.createdAt.toISOString().split('T')[0],
      qrCode: member.qrCode,
      registrationPaid: member.registrationPaid,
      registrationType: member.registrationType,
      totalCheckIns: member._count.checkIns
    }));

    return NextResponse.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName,
      lastName, 
      email, 
      phone, 
      password, 
      registrationType = 'SELF',
      plan,
      dateOfBirth,
    } = body;
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !plan || !dateOfBirth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.MEMBER,
        qrCode: '', // Will be generated after user creation
        registrationType: registrationType as RegistrationType,
        registrationPaid: false,
        emergencyContact: '',
        emergencyPhone: '',
        dateOfBirth: new Date(dateOfBirth)
      }
    });

    // Generate QR code with user ID
    const qrCodeResult = await generateMemberQRCode(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrCodeResult.qrCodeString }
    });

    // For now, automatically mark registration as paid and create subscription
    const planPrices = {
      'ONE_MONTH': 200,
      'THREE_MONTHS': 500,
      'ONE_YEAR': 1800
    };

    const planDurations = {
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'ONE_YEAR': 365
    };

    const planKey = plan as keyof typeof planPrices;
    const amount = planPrices[planKey];
    const duration = planDurations[planKey];

    if (!amount || !duration) {
      return NextResponse.json(
        { error: 'Invalid membership plan' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    // Create subscription first
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: planKey as MembershipPlan,
        amount,
        startDate,
        endDate,
        status: 'ACTIVE',
        registrationType: registrationType as RegistrationType
      }
    });

    // Create payment record for the subscription
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        reference: `SUB_${Date.now()}`,
        status: 'SUCCESS'
      }
    });

    // Mark registration as paid
    // Mark registration as paid and get updated user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { registrationPaid: true }
    });
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        qrCode: user.qrCode,
        registrationPaid: updatedUser.registrationPaid
      }
    });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}