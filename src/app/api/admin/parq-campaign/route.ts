import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { sendEmail } from '@/lib/services/email/mock';

/**
 * Admin endpoint to send PAR-Q reminder emails to existing members
 * Only members who signed up before PAR-Q implementation
 */
export async function POST() {
  try {
    // Verify admin session
    const session = await getSession();
    
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Migration date - users created before this need PAR-Q
    const migrationDate = new Date('2026-01-06T17:18:00Z'); // Migration timestamp

    // Find all users who haven't completed PAR-Q and signed up before migration
    const usersNeedingParQ = await prisma.user.findMany({
      where: {
        parqCompleted: false,
        createdAt: {
          lt: migrationDate,
        },
        role: 'MEMBER', // Only send to members, not staff
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    if (usersNeedingParQ.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need PAR-Q emails',
        count: 0,
      });
    }

    // Send emails in batches to avoid overwhelming the email service
    const emailResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of usersNeedingParQ) {
      try {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30); // 30-day deadline

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚕️ Important: Health Screening Required</h1>
              </div>
              <div class="content">
                <h2>Hi ${user.firstName}!</h2>
                
                <div class="alert">
                  <strong>⚠️ Action Required</strong>
                  <p>As part of our commitment to member safety, we now require all members to complete a health screening questionnaire (PAR-Q).</p>
                </div>
                
                <p>This is a quick 7-question form that helps us:</p>
                <ul>
                  <li>Ensure your safety during workouts</li>
                  <li>Identify any health conditions that need special consideration</li>
                  <li>Create personalized training recommendations</li>
                  <li>Meet insurance and legal requirements</li>
                </ul>
                
                <p><strong>⏱️ Deadline:</strong> ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (30 days)</p>
                
                <p style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/member/par-q" class="button">
                    Complete Health Screening Now
                  </a>
                </p>
                
                <p><strong>What happens if I don't complete it?</strong></p>
                <p>Starting February 6, 2026, you may be asked to complete the PAR-Q at the front desk before checking in. Save time by completing it online now!</p>
                
                <p><strong>Have questions?</strong> Contact our team at the gym or reply to this email.</p>
                
                <p>Thank you for your cooperation!</p>
                <p><strong>The GemFitness Team</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 GemFitness. All rights reserved.</p>
                <p>This is an important safety notice. Please complete your screening.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: user.email,
          subject: '⚕️ Important: Complete Your Health Screening - GemFitness',
          html,
          from: 'GemFitness <noreply@gemfitness.com>',
        });

        successCount++;
        emailResults.push({
          userId: user.id,
          email: user.email,
          status: 'sent',
        });
      } catch (emailError) {
        failureCount++;
        emailResults.push({
          userId: user.id,
          email: user.email,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      message: 'Email campaign completed',
      stats: {
        totalUsers: usersNeedingParQ.length,
        successCount,
        failureCount,
        migrationDate: migrationDate.toISOString(),
      },
      results: emailResults,
    });

  } catch (error) {
    console.error('PAR-Q campaign error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send PAR-Q campaign emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get stats about PAR-Q completion
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const migrationDate = new Date('2026-01-06T17:18:00Z');

    // Get stats
    const [
      totalMembers,
      completedParQ,
      existingMembersNeedingParQ,
      newMembersNeedingParQ,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', parqCompleted: true } }),
      prisma.user.count({
        where: {
          role: 'MEMBER',
          parqCompleted: false,
          createdAt: { lt: migrationDate },
        },
      }),
      prisma.user.count({
        where: {
          role: 'MEMBER',
          parqCompleted: false,
          createdAt: { gte: migrationDate },
        },
      }),
      prisma.user.count({ where: { role: 'MEMBER', parqRiskLevel: 'low' } }),
      prisma.user.count({ where: { role: 'MEMBER', parqRiskLevel: 'medium' } }),
      prisma.user.count({ where: { role: 'MEMBER', parqRiskLevel: 'high' } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers,
        completedParQ,
        notCompleted: totalMembers - completedParQ,
        completionRate: totalMembers > 0 ? ((completedParQ / totalMembers) * 100).toFixed(1) : '0',
        existingMembersNeedingParQ,
        newMembersNeedingParQ,
        riskDistribution: {
          low: lowRiskCount,
          medium: mediumRiskCount,
          high: highRiskCount,
        },
        migrationDate: migrationDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('PAR-Q stats error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch PAR-Q stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
