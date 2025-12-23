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
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { $Enums, Prisma } from '@prisma/client';
import { generateMemberQRCode } from '@/lib/qr/generator';
import { z } from 'zod';
import { verifySessionForApi } from '@/lib/auth/dal';
import fs from 'fs';
import path from 'path';

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
    const where: any = { role: 'MEMBER' };

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
          plan: planParam as any
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
    dateOfBirth: z.string()
  });

  try {
    // Auth: require staff
    const session = await verifySessionForApi();
    if (!session?.isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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

    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const { firstName, lastName, email, phone, password, registrationType = 'SELF', plan, dateOfBirth } = parsed.data;

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
          emergencyContact: '',
          emergencyPhone: '',
          dateOfBirth: new Date(dateOfBirth)
        }
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta && (err.meta.target || err.meta['target'])) || null;
        return NextResponse.json({ error: 'Unique constraint failed', fields: target }, { status: 409 });
      }
      throw err;
    }

    // Generate QR token and store token (not full payload) in DB
    const qrCodeResult = await generateMemberQRCode(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { qrCode: qrCodeResult.token }
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
        amount,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        reference: `SUB_${Date.now()}`,
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
        const mime = profileFile.type || '';
        let ext = 'jpg';
        if (mime && mime.includes('/')) ext = mime.split('/')[1];
        // fallback to original name extension
        const origName = (profileFile as any).name;
        if ((!ext || ext === 'octet-stream') && origName) {
          const m = origName.match(/\.([a-zA-Z0-9]+)$/);
          if (m) ext = m[1];
        }
        const imagesDir = path.join(process.cwd(), 'public', 'images', 'members');
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
        const filename = `${user.id}.${ext}`;
        const filepath = path.join(imagesDir, filename);
        fs.writeFileSync(filepath, buffer);
        await prisma.user.update({ where: { id: user.id }, data: { profileImage: `/images/members/${filename}` } });
      }
    } catch (err) {
      console.warn('Failed to save profile image:', err);
    }
    return NextResponse.json({ 
      success: true, 
        user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        qrCode: `GYM|${qrCodeResult.token}`,
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