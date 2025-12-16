/**
 * REGISTRATION FEES API
 * 
 * Endpoints:
 * - GET /api/registration-fees - Get all registration fees
 * - PUT /api/registration-fees - Update registration fees (Admin only)
 * 
 * Used by: Admin Dashboard (Plans tab)
 * Purpose: Manage dynamic registration fees for SINGLE, COUPLE, FAMILY
 * 
 * NOTE: Run `npx prisma generate` to update Prisma client with RegistrationFee model
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/auth/dal';
import { isAdmin } from '@/lib/auth/permissions';

// GET /api/registration-fees - Get all registration fees
export async function GET() {
  try {
    // @ts-expect-error - registrationFee model exists after prisma generate
    const fees = await prisma.registrationFee.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        price: 'asc',
      },
    });

    // If no fees exist, seed with default values
    if (fees.length === 0) {
      const defaultFees = await Promise.all([
        // @ts-expect-error - registrationFee model exists after prisma generate
        prisma.registrationFee.create({
          data: {
            type: 'SINGLE',
            name: 'Single',
            price: 250,
            description: 'Individual membership',
            maxMembers: 1,
            status: 'ACTIVE',
            currency: 'GH₵',
          },
        }),
        // @ts-expect-error - registrationFee model exists after prisma generate
        prisma.registrationFee.create({
          data: {
            type: 'COUPLE',
            name: 'Couple',
            price: 400,
            description: '2 members package',
            maxMembers: 2,
            status: 'ACTIVE',
            currency: 'GH₵',
          },
        }),
        // @ts-expect-error - registrationFee model exists after prisma generate
        prisma.registrationFee.create({
          data: {
            type: 'FAMILY',
            name: 'Family',
            price: 1000,
            description: 'Up to 5 members',
            maxMembers: 5,
            status: 'ACTIVE',
            currency: 'GH₵',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        fees: defaultFees,
      });
    }

    return NextResponse.json({
      success: true,
      fees,
    });
  } catch (error) {
    console.error('❌ Error fetching registration fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registration fees' },
      { status: 500 }
    );
  }
}

// PUT /api/registration-fees - Update registration fees (Admin/Manager only)
export async function PUT(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can update fees
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { fees } = body;

    if (!Array.isArray(fees)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Update each fee
    const updates = fees.map((fee: { type: string; price: number; description?: string; maxMembers?: number }) =>
      // @ts-expect-error - registrationFee model exists after prisma generate
      prisma.registrationFee.updateMany({
        where: { type: fee.type },
        data: {
          price: fee.price,
          description: fee.description,
          maxMembers: fee.maxMembers,
          updatedAt: new Date(),
        },
      })
    );

    await Promise.all(updates);

    // Fetch updated fees
    // @ts-expect-error - registrationFee model exists after prisma generate
    const updatedFees = await prisma.registrationFee.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        price: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      fees: updatedFees,
      message: 'Registration fees updated successfully',
    });
  } catch (error) {
    console.error('❌ Error updating registration fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update registration fees' },
      { status: 500 }
    );
  }
}
