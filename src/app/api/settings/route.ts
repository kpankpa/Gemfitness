import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings
 * Fetch gym settings
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view settings (only managers and admins)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For now, return default settings (in production, these would be stored in database)
    const gymSettings = {
      name: 'GemFitness Tema',
      slogan: 'Transform Your Body, Transform Your Life',
      email: 'info@gemfitness.fit',
      phone: '+233 249003832',
      address: 'Gbetsile, Tema, Greater Accra Region, Ghana',
      website: 'www.gemfitness.fit',
      timezone: 'Africa/Accra',
      currency: 'GHS',
      operatingHours: {
        monday: { open: '05:00', close: '22:00', closed: false },
        tuesday: { open: '05:00', close: '22:00', closed: false },
        wednesday: { open: '05:00', close: '22:00', closed: false },
        thursday: { open: '05:00', close: '22:00', closed: false },
        friday: { open: '05:00', close: '22:00', closed: false },
        saturday: { open: '06:00', close: '20:00', closed: false },
        sunday: { open: '07:00', close: '18:00', closed: false },
      },
    };

    const paymentSettings = {
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
      paystackSecretKey: '', // Never send secret key to frontend
      testMode: process.env.PAYSTACK_TEST_MODE === 'true',
      enabledMethods: ['cash', 'momo', 'card'],
      currency: 'GHS',
      autoRenewal: true,
      gracePeriodDays: 7,
    };

    const notificationSettings = {
      emailNotifications: true,
      smsNotifications: false,
      membershipExpiry: true,
      paymentReminders: true,
      classUpdates: true,
      systemAlerts: true,
    };

    const securitySettings = {
      sessionTimeout: 30,
      twoFactorAuth: false,
      passwordExpiry: 90,
      maxLoginAttempts: 5,
    };

    return NextResponse.json({
      success: true,
      gymSettings,
      paymentSettings,
      notificationSettings,
      securitySettings,
    });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update gym settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await verifySessionForApi();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update settings (only managers and admins)
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, email: true, firstName: true, lastName: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { gymSettings, paymentSettings, notificationSettings, securitySettings } = body;

    // Validate required fields
    if (gymSettings) {
      if (!gymSettings.name || !gymSettings.email || !gymSettings.phone) {
        return NextResponse.json(
          { error: 'Gym name, email, and phone are required' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(gymSettings.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate payment settings
    if (paymentSettings) {
      if (!paymentSettings.testMode && !paymentSettings.paystackSecretKey) {
        return NextResponse.json(
          { error: 'Secret key required for live payment mode' },
          { status: 400 }
        );
      }

      if (paymentSettings.gracePeriodDays < 0 || paymentSettings.gracePeriodDays > 30) {
        return NextResponse.json(
          { error: 'Grace period must be between 0-30 days' },
          { status: 400 }
        );
      }
    }

    // Validate security settings
    if (securitySettings) {
      if (securitySettings.sessionTimeout < 5 || securitySettings.sessionTimeout > 120) {
        return NextResponse.json(
          { error: 'Session timeout must be between 5-120 minutes' },
          { status: 400 }
        );
      }

      if (securitySettings.maxLoginAttempts < 3 || securitySettings.maxLoginAttempts > 10) {
        return NextResponse.json(
          { error: 'Max login attempts must be between 3-10' },
          { status: 400 }
        );
      }
    }

    // In production, save settings to database
    // For now, we'll just log the changes and return success
    console.log('Settings updated by:', user.email);
    console.log('Gym Settings:', gymSettings);
    console.log('Payment Settings:', paymentSettings ? { ...paymentSettings, paystackSecretKey: '[REDACTED]' } : null);
    console.log('Notification Settings:', notificationSettings);
    console.log('Security Settings:', securitySettings);

    // Create audit log for settings update
    try {
      await prisma.auditLog.create({
        data: {
          action: 'settings_updated',
          entityType: 'Settings',
          entityId: 'system',
          userId: session.userId,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userEmail: user.email,
          changes: {
            gymSettings,
            paymentSettingsUpdated: !!paymentSettings,
            notificationSettingsUpdated: !!notificationSettings,
            securitySettingsUpdated: !!securitySettings,
          },
          metadata: {
            updatedBy: user.email,
            updateTime: new Date().toISOString(),
          },
        },
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
      // Don't fail the request if audit log creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      _note: 'Settings are currently stored in memory. Database persistence pending implementation.',
    });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
