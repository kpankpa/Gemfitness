import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/services/email/mock';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().max(40).optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(120),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

/**
 * POST /api/contact
 * Persist a contact form submission and notify the gym inbox.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone?.trim() || null,
        subject: data.subject,
        message: data.message.trim(),
      },
    });

    const gymInbox =
      process.env.CONTACT_INBOX_EMAIL ||
      process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
      'info@gemfitness.fit';

    const notifyResult = await sendEmail({
      to: gymInbox,
      subject: `Contact: ${data.subject} | ${data.firstName} ${data.lastName}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>From:</strong> ${data.firstName} ${data.lastName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p style="color:#666;font-size:12px;">Submission ID: ${contactMessage.id}</p>
      `,
      from: 'GemFitness Website <noreply@gemfitness.com>',
    });

    // Confirmation to the sender
    await sendEmail({
      to: data.email,
      subject: 'We received your message | GemFitness',
      html: `
        <p>Hi ${data.firstName},</p>
        <p>Thanks for contacting GemFitness. We've received your message about <strong>${data.subject}</strong> and will get back to you within 24 hours.</p>
        <p>The GemFitness Team</p>
      `,
    });

    if (!notifyResult.success) {
      logger.warn('Contact saved but staff notification email failed', {
        id: contactMessage.id,
        message: notifyResult.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      id: contactMessage.id,
    });
  } catch (error) {
    logger.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or call us.' },
      { status: 500 }
    );
  }
}
