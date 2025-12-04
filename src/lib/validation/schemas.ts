import { z } from 'zod';

// Auth Schemas
export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const age = new Date().getFullYear() - dob.getFullYear();
    return age >= 16 && age <= 100;
  }, 'You must be at least 16 years old'),
  address: z.string().optional(),
  emergencyContact: z.string().min(2, 'Emergency contact name required'),
  emergencyPhone: z.string().min(10, 'Emergency phone must be at least 10 digits'),
  fitnessGoals: z.string().optional(),
  medicalConditions: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to terms'),
  plan: z.enum(['monthly', 'quarterly', 'annual']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Member Schemas
export const createMemberSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  address: z.string().optional(),
  emergencyContact: z.string().min(2),
  emergencyPhone: z.string().min(10),
  fitnessGoals: z.string().optional(),
  medicalConditions: z.string().optional(),
  role: z.enum(['MEMBER', 'RECEPTIONIST', 'MANAGER', 'ADMIN']).default('MEMBER'),
  plan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  registrationType: z.enum(['SELF', 'WALK_IN', 'ADMIN']),
  password: z.string().min(8),
});

// Check-in Schemas
export const checkInSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  checkInTime: z.date().optional(),
});

export const scanQRSchema = z.object({
  qrCode: z.string().min(10, 'Invalid QR code'),
});

// Subscription Schemas
export const createSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  amount: z.number().positive(),
  paymentReference: z.string(),
});

export const updateSubscriptionSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  endDate: z.date().optional(),
});

// Plan Schemas
export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters').max(100),
  slug: z.string().min(2).max(50).regex(/^[A-Z_]+$/, 'Slug must be uppercase with underscores only'),
  description: z.string().max(500).optional(),
  price: z.number().positive('Price must be greater than 0').min(1),
  duration: z.number().int().positive('Duration must be positive').min(1),
  durationUnit: z.enum(['days', 'weeks', 'months', 'years']).default('days'),
  features: z.array(z.string().max(200)).max(20, 'Maximum 20 features allowed').default([]),
  isPopular: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).max(999).default(0),
});

export const updatePlanSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive().min(1).optional(),
  duration: z.number().int().positive().min(1).optional(),
  durationUnit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  isPopular: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(999).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

// Type exports
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ScanQRInput = z.infer<typeof scanQRSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
