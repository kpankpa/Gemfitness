import { NextRequest, NextResponse } from 'next/server';
import { verifySessionForApi } from '@/lib/auth/dal';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const DEFAULT_GYM_SETTINGS = {
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

const DEFAULT_PAYMENT_SETTINGS = {
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  paystackSecretKey: '',
  testMode: process.env.PAYSTACK_TEST_MODE === 'true',
  enabledMethods: ['cash', 'momo', 'card'],
  currency: 'GHS',
  autoRenewal: true,
  gracePeriodDays: 7,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  smsNotifications: false,
  membershipExpiry: true,
  paymentReminders: true,
  classUpdates: true,
  systemAlerts: true,
};

const DEFAULT_SECURITY_SETTINGS = {
  sessionTimeout: 30,
  twoFactorAuth: false,
  passwordExpiry: 90,
  maxLoginAttempts: 5,
};

type JsonRecord = Record<string, unknown>;

async function getSettingValue(key: string): Promise<JsonRecord | null> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (!row) return null;
    return (row.value as JsonRecord) || null;
  } catch (error) {
    console.warn(`Failed to read system setting "${key}":`, error);
    return null;
  }
}

async function upsertSetting(key: string, value: Prisma.InputJsonValue) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [storedGym, storedPayment, storedNotifications, storedSecurity] =
      await Promise.all([
        getSettingValue('gym'),
        getSettingValue('payment'),
        getSettingValue('notifications'),
        getSettingValue('security'),
      ]);

    const gymSettings = { ...DEFAULT_GYM_SETTINGS, ...(storedGym || {}) };

    const paymentSettings = {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...(storedPayment || {}),
      // Never expose secret key to the client; fall back to env public key when unset
      paystackSecretKey: '',
      paystackPublicKey:
        (storedPayment?.paystackPublicKey as string) ||
        process.env.PAYSTACK_PUBLIC_KEY ||
        '',
    };

    const notificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(storedNotifications || {}),
    };

    const securitySettings = {
      ...DEFAULT_SECURITY_SETTINGS,
      ...(storedSecurity || {}),
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, email: true, firstName: true, lastName: true },
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { gymSettings, paymentSettings, notificationSettings, securitySettings } =
      body;

    if (gymSettings) {
      if (!gymSettings.name || !gymSettings.email || !gymSettings.phone) {
        return NextResponse.json(
          { error: 'Gym name, email, and phone are required' },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(gymSettings.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    if (paymentSettings) {
      if (
        paymentSettings.gracePeriodDays < 0 ||
        paymentSettings.gracePeriodDays > 30
      ) {
        return NextResponse.json(
          { error: 'Grace period must be between 0-30 days' },
          { status: 400 }
        );
      }
    }

    if (securitySettings) {
      if (
        securitySettings.sessionTimeout < 5 ||
        securitySettings.sessionTimeout > 120
      ) {
        return NextResponse.json(
          { error: 'Session timeout must be between 5-120 minutes' },
          { status: 400 }
        );
      }

      if (
        securitySettings.maxLoginAttempts < 3 ||
        securitySettings.maxLoginAttempts > 10
      ) {
        return NextResponse.json(
          { error: 'Max login attempts must be between 3-10' },
          { status: 400 }
        );
      }
    }

    if (gymSettings) {
      await upsertSetting('gym', gymSettings as Prisma.InputJsonValue);
    }

    if (paymentSettings) {
      // Persist non-secret payment prefs; secret keys stay in env
      const { paystackSecretKey: submittedSecret, ...safePayment } = paymentSettings;
      await upsertSetting('payment', {
        ...safePayment,
        paystackSecretKeyConfigured: Boolean(
          submittedSecret || process.env.PAYSTACK_SECRET_KEY
        ),
      } as Prisma.InputJsonValue);
    }

    if (notificationSettings) {
      await upsertSetting('notifications', notificationSettings as Prisma.InputJsonValue);
    }

    if (securitySettings) {
      await upsertSetting('security', securitySettings as Prisma.InputJsonValue);
    }

    try {
      await prisma.auditLog.create({
        data: {
          action: 'settings_updated',
          entityType: 'Settings',
          entityId: 'system',
          userId: session.userId,
          userName:
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
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
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
