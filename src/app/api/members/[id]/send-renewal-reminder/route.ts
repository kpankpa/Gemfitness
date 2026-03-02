/**
 * POST /api/members/[id]/send-renewal-reminder
 * Manually send a renewal reminder email to a specific member.
 * Used by admin "Contact" button in the Expiring Soon dashboard card.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionForApi } from '@/lib/auth/dal';
import { sendRenewalEmails } from '@/lib/services/email/renewal-emails';
import logger from '@/lib/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Staff only
    const session = await verifySessionForApi();
    if (!session?.isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch member + active subscription
    const user = await prisma.user.findFirst({
      where: { id, role: 'MEMBER' },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const subscription = user.subscriptions[0];
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found for this member' },
        { status: 400 }
      );
    }

    const now = new Date();
    const daysUntilExpiry = Math.max(
      0,
      Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Prevent spam: don't resend within 4 hours
    const recentReminder = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'EXPIRY_WARNING',
        subject: { contains: 'manual-reminder' },
        sentAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
      },
    });

    if (recentReminder) {
      return NextResponse.json(
        { error: 'A reminder was already sent to this member in the last 4 hours.' },
        { status: 429 }
      );
    }

    // Send the email
    const result = await sendRenewalEmails.sendRenewalReminderEmail({
      to: user.email,
      firstName: user.firstName,
      daysUntilExpiry,
      amount: subscription.amount,
    });

    if (!result.success) {
      logger.error('Failed to send renewal reminder email', { userId: user.id, error: result.error });
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Record in notifications table to prevent spam
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'EXPIRY_WARNING',
        subject: `manual-reminder: ${daysUntilExpiry} days`,
        message: `Renewal reminder sent manually by staff. ${daysUntilExpiry} days until expiry.`,
        status: 'sent',
        sentAt: now,
      },
    });

    logger.info(`Manual renewal reminder sent to ${user.email} (${daysUntilExpiry} days left)`);

    return NextResponse.json({
      success: true,
      message: `Renewal reminder sent to ${user.firstName} (${user.email})`,
      daysUntilExpiry,
    });
  } catch (error) {
    logger.error('send-renewal-reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
