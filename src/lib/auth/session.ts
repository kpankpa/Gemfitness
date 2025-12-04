import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { $Enums } from '@prisma/client';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  role: $Enums.UserRole;
  expiresAt: Date;
}

/**
 * Encrypt session payload and create JWT token
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(encodedKey);
}

/**
 * Decrypt and verify JWT token
 */
export async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string, email: string, role: $Enums.UserRole) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, email, role, expiresAt });

  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return session;
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  return decrypt(session);
}

/**
 * Delete the current session
 */
export async function deleteSession() {
  (await cookies()).delete('session');
}

/**
 * Update the session expiration
 */
export async function updateSession() {
  const session = (await cookies()).get('session')?.value;
  const payload = await decrypt(session);

  if (!payload) return null;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const newSession = await encrypt({ ...payload, expiresAt });

  (await cookies()).set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return newSession;
}
