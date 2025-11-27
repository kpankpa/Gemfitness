import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'GHS'): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Debounce function for search inputs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid phone number (Nigerian format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Nigerian phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Calculate membership duration
 */
export function getMembershipDuration(
  plan: 'monthly' | 'quarterly' | 'annual'
): { months: number; label: string } {
  switch (plan) {
    case 'monthly':
      return { months: 1, label: '1 Month' };
    case 'quarterly':
      return { months: 3, label: '3 Months' };
    case 'annual':
      return { months: 12, label: '12 Months' };
  }
}

/**
 * Calculate membership expiry date
 */
export function calculateExpiryDate(
  startDate: Date,
  plan: 'monthly' | 'quarterly' | 'annual'
): Date {
  const { months } = getMembershipDuration(plan);
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

/**
 * Check if membership is expiring soon (within 7 days)
 */
export function isExpiringSoon(expiryDate: Date): boolean {
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
}

/**
 * Check if membership is expired
 */
export function isExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Get membership status
 */
export function getMembershipStatus(expiryDate: Date): 'active' | 'expiring' | 'expired' {
  if (isExpired(expiryDate)) return 'expired';
  if (isExpiringSoon(expiryDate)) return 'expiring';
  return 'active';
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
