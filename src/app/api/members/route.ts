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
import type { Prisma } from '@prisma/client';

// Type for user with included relations
type UserWithSubscriptions = Prisma.UserGetPayload<{
  include: {
    subscriptions: true;
    _count: {
      select: {
        checkIns: true;
        payments: true;
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
              expiresAt: {
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
            checkIns: true,
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) as UserWithSubscriptions[];

    const formattedMembers = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      plan: member.subscriptions[0]?.plan?.replace(/_/g, ' ') || 'No Plan',
      status: member.subscriptions[0]?.status?.toLowerCase() || 'inactive',
      expiresAt: member.subscriptions[0]?.expiresAt?.toISOString().split('T')[0] || null,
      joinDate: member.createdAt.toISOString().split('T')[0],
      qrCode: member.qrCode,
      registrationPaid: member.registrationPaid,
      registrationType: member.registrationType,
      totalCheckIns: member._count.checkIns,
      totalPayments: member._count.payments
    }));

    return NextResponse.json({ members: formattedMembers });
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
      name, 
      email, 
      phone, 
      password, 
      registrationType = 'SINGLE',
      plan,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !plan) {
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

    // Generate QR code (simple format for now)
    const qrCode = `GM${Date.now().toString(36).toUpperCase()}`;

    // Calculate registration fee based on type
    const registrationFees = {
      SINGLE: 250,
      COUPLE: 400,
      FAMILY: 1000
    };

    const registrationFee = registrationFees[registrationType as keyof typeof registrationFees];

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.MEMBER,
        qrCode,
        registrationType: registrationType as RegistrationType,
        registrationPaid: false // Will be updated when payment is confirmed
      }
    });

    // For now, automatically mark registration as paid and create subscription
    const planPrices = {
      'DAILY': 50,
      'ONE_MONTH': 200,
      'THREE_MONTHS': 450,
      'SIX_MONTHS': 1000,
      'TWELVE_MONTHS': 2000
    };

    const planDurations = {
      'DAILY': 1,
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'SIX_MONTHS': 180,
      'TWELVE_MONTHS': 365
    };

    const planKey = plan.replace(/\s+/g, '_').toUpperCase() as keyof typeof planPrices;
    const amount = planPrices[planKey];
    const duration = planDurations[planKey];

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Create registration payment record (marked as SUCCESS for demo)
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: registrationFee,
        paymentType: 'REGISTRATION',
        status: 'SUCCESS',
        reference: `REG_${Date.now()}`,
        paidAt: new Date()
      }
    });

    // Create subscription payment record
    const subscriptionPayment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        plan: planKey,
        paymentType: 'SUBSCRIPTION',
        status: 'SUCCESS',
        reference: `SUB_${Date.now()}`,
        paidAt: new Date()
      }
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: planKey,
        amount,
        expiresAt,
        paymentId: subscriptionPayment.id
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
        name: user.name,
        email: user.email,
        qrCode: user.qrCode,
        registrationFee,
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