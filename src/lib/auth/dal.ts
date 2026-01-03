import 'server-only';
import { cache } from 'react';
import { getSession } from './session';
import { prisma } from '@/lib/prisma';

/**
 * Verify and get the current user's session
 * Uses React cache to avoid redundant queries
 */
export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.userId) {
    return { isAuth: false, userId: null, role: null };
  }

  return { isAuth: true, userId: session.userId, role: session.role };
});

/**
 * Verify session for API routes (no React cache)
 * Avoid using `cache()` here so session is evaluated per-request
 */
export async function verifySessionForApi() {
  const session = await getSession();

  if (!session?.userId) {
    return { isAuth: false, userId: null, role: null };
  }

  return { isAuth: true, userId: session.userId, role: session.role };
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
// Cached implementation for server components and non-API usage
const _getUserCached = cache(async () => {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            endDate: 'desc',
          },
          take: 1,
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
});

/**
 * Public `getUser` wrapper.
 * By default returns cached result (suitable for server components).
 * Call `getUser({ useCache: false })` or `getUserForApi()` from API routes to avoid React cache.
 */
export async function getUser(options?: { useCache?: boolean }) {
  const useCache = options?.useCache ?? true;
  if (useCache) return _getUserCached();

  // Non-cached API path
  const session = await verifySessionForApi();
  if (!session.isAuth || !session.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        checkIns: {
          orderBy: { checkInTime: 'desc' },
          take: 10,
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user (API):', error);
    return null;
  }
}

export const getUserForApi = async () => getUser({ useCache: false });

/**
 * Get user with full subscription details
 */
// Cached variant for server components
const _getUserWithSubscriptionCached = cache(async () => {
  const session = await verifySession();

  if (!session.isAuth || !session.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        checkIns: {
          orderBy: {
            checkInTime: 'desc',
          },
          take: 10,
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user with subscription:', error);
    return null;
  }
});

export async function getUserWithSubscription(options?: { useCache?: boolean }) {
  const useCache = options?.useCache ?? true;
  if (useCache) return _getUserWithSubscriptionCached();

  const session = await verifySessionForApi();
  if (!session.isAuth || !session.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        checkIns: {
          orderBy: {
            checkInTime: 'desc',
          },
          take: 10,
        },
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user with subscription (API):', error);
    return null;
  }
}

export const getUserWithSubscriptionForApi = async () => getUserWithSubscription({ useCache: false });

/**
 * Check if user has an active subscription
 */
const _hasActiveSubscriptionCached = cache(async (): Promise<boolean> => {
  const user = await _getUserWithSubscriptionCached();

  if (!user) return false;

  const activeSubscription = user.subscriptions?.[0];

  if (!activeSubscription) return false;

  return (
    activeSubscription.status === 'ACTIVE' &&
    activeSubscription.endDate > new Date()
  );
});

export async function hasActiveSubscription(options?: { useCache?: boolean }): Promise<boolean> {
  const useCache = options?.useCache ?? true;
  if (useCache) return _hasActiveSubscriptionCached();

  const user = await getUserWithSubscriptionForApi();
  if (!user) return false;

  const activeSubscription = user.subscriptions?.[0];
  if (!activeSubscription) return false;

  return (
    activeSubscription.status === 'ACTIVE' &&
    activeSubscription.endDate > new Date()
  );
}

export const hasActiveSubscriptionForApi = async () => hasActiveSubscription({ useCache: false });

/**
 * Check if user has a specific role
 */
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const session = await verifySession();

  if (!session.isAuth || !session.role) {
    return false;
  }

  return allowedRoles.includes(session.role);
}
