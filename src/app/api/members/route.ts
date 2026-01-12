/**
 * ADMIN MEMBER MANAGEMENT API
 * 
 * Endpoints:
 * - GET /api/members - Fetch all members
 * - POST /api/members - Register new member
 * 
 * Used by: Admin Dashboard
 * Purpose: Member CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { $Enums, Prisma } from '@prisma/client';
import { z } from 'zod';
import { generateMemberQRCode } from '@/lib/qr/generator';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi, verifySessionWithUserDetails } from '@/lib/auth/dal';
import { AuditLogger, getClientInfo } from '@/lib/audit/logger';
import { processMemberImage, ImageValidationError } from '../../../lib/image/processor';

// GET /api/members - Fetch all members
export async function GET(request: NextRequest) {
  try {
    // Auth: require staff
    const session = await verifySessionForApi();
    if (!session?.isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limitParam = parseInt(searchParams.get('limit') || '25', 10) || 25;
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined; // active|expired|expiring_soon
    const planParam = searchParams.get('plan') || undefined; // plan slug like ONE_MONTH
    const page = Math.max(1, pageParam);
    const limit = Math.min(500, Math.max(1, limitParam));
    const skip = (page - 1) * limit;

    // Build where clause
    const now = new Date();
    const where: Prisma.UserWhereInput = { role: 'MEMBER' };

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { qrCode: { contains: q } }
      ];
    }

    if (status) {
      if (status === 'active') {
        where.subscriptions = { some: { status: 'ACTIVE', endDate: { gte: now } } };
      } else if (status === 'expiring_soon') {
        const soon = new Date(now);
        soon.setDate(soon.getDate() + 3);
        where.subscriptions = { some: { status: 'ACTIVE', endDate: { gte: now, lte: soon } } };
      } else if (status === 'expired') {
        where.subscriptions = { none: { status: 'ACTIVE', endDate: { gte: now } } };
      }
    }
    if (planParam) {
      where.subscriptions = {
        some: {
          plan: planParam as $Enums.MembershipPlan
        }
      };
    }

    // Get total for pagination, then fetch page
    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        subscriptions: {
          orderBy: { endDate: 'desc' },
          take: 1
        }
      }
    });

    const members = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      plan: user.subscriptions?.[0]?.plan || 'N/A',
      status: user.subscriptions?.[0] ? (new Date(user.subscriptions[0].endDate) > now ? ( (new Date(user.subscriptions[0].endDate).getTime() - now.getTime())/(1000*60*60*24) <=3 ? 'expiring_soon' : 'active') : 'expired') : 'expired',
      expiresAt: user.subscriptions?.[0]?.endDate ? user.subscriptions[0].endDate.toISOString().split('T')[0] : null,
      joinDate: user.createdAt.toISOString().split('T')[0],
      qrCode: user.qrCode ? `GYM|${user.qrCode}` : null,
      registrationPaid: user.registrationPaid,
      registrationType: user.registrationType,
      totalCheckIns: 0
    }));

    return NextResponse.json({ success: true, members, totalMembers: total, page, limit });
  } catch (error) {
    console.error('Members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST /api/members - Create new member
export async function POST(request: NextRequest) {
  const createMemberSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(6),
    registrationType: z.string().optional(),
    plan: z.string(),
    dateOfBirth: z.string(),
    // Emergency contact
    emergencyContact: z.string().min(2),
    emergencyPhone: z.string().min(7),
    // PAR-Q fields
    hasHeartCondition: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    hasChestPain: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    hasDizziness: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    hasJointProblems: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    takesMedication: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    hasOtherConditions: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
    otherConditionsDetails: z.string().optional(),
    // Payment fields
    paymentMethod: z.enum(['CASH', 'MOMO']),
    amountPaid: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
    momoReference: z.string().optional(),
    // Additional profile fields
    address: z.string().optional(),
    fitnessGoals: z.string().optional(),
    medicalConditions: z.string().optional()
  });

  try {
    // Auth: require staff
    const session = await verifySessionWithUserDetails();
    if (!session?.isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const { 
      firstName, lastName, email, phone, password, registrationType = 'WALK_IN', plan, dateOfBirth,
      emergencyContact, emergencyPhone,
      hasHeartCondition, hasChestPain, hasDizziness, hasJointProblems, takesMedication, hasOtherConditions, otherConditionsDetails,
      paymentMethod, amountPaid, momoReference,
      address, fitnessGoals, medicalConditions
    } = parsed.data;

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    let user;
    try {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
          role: $Enums.UserRole.MEMBER,
          qrCode: '', // Will be generated after user creation
          registrationType: registrationType as $Enums.RegistrationType,
          registrationPaid: false,
          emergencyContact,
          emergencyPhone,
          dateOfBirth: new Date(dateOfBirth),
          address: address || '',
          fitnessGoals: fitnessGoals || '',
          medicalConditions: medicalConditions || ''
        }
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta && (err.meta.target || err.meta['target'])) || null;
        return NextResponse.json({ error: 'Unique constraint failed', fields: target }, { status: 409 });
      }
      throw err;
    }

    // Generate QR token and store token (not full payload) in DB
    const qrCodeResult = await generateMemberQRCode();
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrCodeResult.token }
    });

    // Create PAR-Q response
    // Compute risk level based on responses
    const yesCount = [hasHeartCondition, hasChestPain, hasDizziness, hasJointProblems, takesMedication, hasOtherConditions].filter(Boolean).length;
    const riskLevel = yesCount === 0 ? 'LOW' : yesCount <= 2 ? 'MEDIUM' : 'HIGH';

    await prisma.parQResponse.create({
      data: {
        userId: user.id,
        responses: JSON.stringify({
          hasHeartCondition,
          hasChestPain,
          hasDizziness,
          hasJointProblems,
          takesMedication,
          hasOtherConditions
        }),
        otherReasonDetails: otherConditionsDetails || '',
        riskLevel: riskLevel,
        completedAt: new Date()
      }
    });

    // Update user PAR-Q completion status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        parqCompleted: true,
        parqCompletedAt: new Date(),
        parqRiskLevel: riskLevel
      }
    });

    const planPrices = {
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
        plan: planKey as $Enums.MembershipPlan,
        amount,
        startDate,
        endDate,
        status: 'ACTIVE',
        registrationType: registrationType as $Enums.RegistrationType
      }
    });

    // Create payment record for the subscription
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: amountPaid,
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        reference: paymentMethod === 'MOMO' && momoReference ? momoReference : `CASH_${Date.now()}`,
        status: 'SUCCESS'
      }
    });

    // Mark registration as paid and return
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { registrationPaid: true }
    });

    // Handle profile image file upload if provided (multipart/form-data)
    try {
      if (profileFile) {
        const arrayBuffer = await profileFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        try {
          const { imagePath } = await processMemberImage(buffer, profileFile.name || 'upload', user.id);
          await prisma.user.update({ where: { id: user.id }, data: { profileImage: imagePath } });
        } catch (err: unknown) {
          if (err instanceof ImageValidationError) {
            // Remove created payment/subscription/user if image invalid
            try {
              // delete payments for the subscription we created
              await prisma.payment.deleteMany({ where: { subscriptionId: subscription.id } }).catch(() => {});
            } catch {}
            try {
              await prisma.subscription.deleteMany({ where: { id: subscription.id } }).catch(() => {});
            } catch {}
            try {
              await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
            } catch {}
            return NextResponse.json({ error: 'Invalid image upload', code: (err as ImageValidationError).code, message: (err as ImageValidationError).message }, { status: 400 });
          }
          console.warn('Failed to save profile image:', err);
        }
      }
    } catch (err: unknown) {
      console.warn('Failed to save profile image:', err);
    }

    // Get client info and log audit trail
    const { ipAddress, userAgent } = getClientInfo(request);
    try {
      await AuditLogger.logMemberAction(
        'member_created',
        user.id,
        session.userId!,
        `${session.firstName} ${session.lastName}`,
        session.email,
        {
          memberName: `${user.firstName} ${user.lastName}`,
          memberEmail: user.email,
          plan: planKey,
          registrationType,
          paymentMethod,
          amountPaid
        },
        ipAddress,
        userAgent
      );
    } catch (auditError) {
      console.warn('Failed to log audit trail:', auditError);
    }

    return NextResponse.json({ 
      success: true, 
        user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        qrCode: `GYM|${qrCodeResult.token}`,
        registrationPaid: updatedUser.registrationPaid,
        emergencyContact,
        emergencyPhone,
        paymentMethod,
        amountPaid,
        momoReference: momoReference || null,
        plan: planKey,
        parqCompleted: true,
        parqRiskLevel: riskLevel
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