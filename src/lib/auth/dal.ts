import 'server-only';
import { cache } from 'react';
import { getSession } from './session';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

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
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export const getUser = cache(async () => {
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
 * Get user with full subscription details
 */
export const getUserWithSubscription = cache(async () => {
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

/**
 * Check if user has an active subscription
 */
export const hasActiveSubscription = cache(async (): Promise<boolean> => {
  const user = await getUser();
  
  if (!user) return false;

  const activeSubscription = user.subscriptions?.[0];
  
  if (!activeSubscription) return false;

  return (
    activeSubscription.status === 'ACTIVE' &&
    activeSubscription.endDate > new Date()
  );
});

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
