import 'server-only';
import { UserRole } from '@prisma/client';

/**
 * Session interface for type safety
 */
export interface SessionData {
  isAuth: boolean;
  userId: string | null;
  role: UserRole | null;
}

/**
 * Check if session has one of the allowed roles
 * @param session - Session object from verifySession()
 * @param allowedRoles - Array of roles that are allowed
 * @returns boolean indicating if user has permission
 */
export function hasRole(session: SessionData, allowedRoles: UserRole[]): boolean {
  if (!session.isAuth || !session.role) {
    return false;
  }
  return allowedRoles.includes(session.role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: SessionData): boolean {
  return hasRole(session, ['ADMIN']);
}

/**
 * Check if user is admin or manager
 */
export function isAdminOrManager(session: SessionData): boolean {
  return hasRole(session, ['ADMIN', 'MANAGER']);
}

/**
 * Check if user is staff (admin, manager, or receptionist)
 */
export function isStaff(session: SessionData): boolean {
  return hasRole(session, ['ADMIN', 'MANAGER', 'RECEPTIONIST']);
}
