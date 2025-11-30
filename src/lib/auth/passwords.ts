import bcrypt from 'bcryptjs';
import { zxcvbnAsync } from '@zxcvbn-ts/core';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check password strength
 * Returns a score from 0-4 (0 = weak, 4 = strong)
 */
export async function checkPasswordStrength(password: string): Promise<{
  score: number;
  feedback: string[];
  isStrong: boolean;
}> {
  try {
    const result = await zxcvbnAsync(password);
    
    const feedback: string[] = [];
    if (result.feedback.warning) {
      feedback.push(result.feedback.warning);
    }
    if (result.feedback.suggestions) {
      feedback.push(...result.feedback.suggestions);
    }

    return {
      score: result.score,
      feedback,
      isStrong: result.score >= 3, // Score 3 or 4 is considered strong
    };
  } catch {
    // Fallback to basic validation if zxcvbn fails
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars, isLongEnough]
      .filter(Boolean).length;

    const feedback: string[] = [];
    if (!isLongEnough) feedback.push('Password should be at least 8 characters');
    if (!hasUpperCase) feedback.push('Add uppercase letters');
    if (!hasLowerCase) feedback.push('Add lowercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSpecialChars) feedback.push('Add special characters');

    return {
      score: Math.min(score - 1, 4),
      feedback,
      isStrong: score >= 4,
    };
  }
}

/**
 * Validate password meets minimum requirements
 */
export function validatePasswordRequirements(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
