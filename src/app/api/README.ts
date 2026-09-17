/**
 * GEMFITNESS API STRUCTURE OVERVIEW
 *
 * This document explains the API organization for the GemFitness gym management system.
 *
 * API STRUCTURE:
 *
 * 1. ADMIN OPERATIONS (used by receptionist/manager dashboards):
 *    /api/members/
 *    - GET  /api/members - Fetch all members for admin dashboard
 *    - POST /api/members - Register new member (admin registration)
 *
 *    /api/checkins/
 *    - GET  /api/checkins - Get today's check-ins
 *    - POST /api/checkins - Create new check-in (QR or manual)
 *
 *    /api/analytics/
 *    - GET /api/analytics - Dashboard statistics and recent data
 *
 * 2. MEMBER OPERATIONS (used by individual member dashboards):
 *    /api/member/dashboard/
 *    - GET /api/member/dashboard?userId=xxx - Individual member dashboard data
 *    - GET /api/member/dashboard?email=xxx  - Dashboard data by email
 *
 * 3. PAYMENT OPERATIONS:
 *    /api/payment/
 *    - POST /api/payment/initialize - Initialize Paystack payment
 *    - GET  /api/payment/verify - Verify Paystack transaction
 *    /api/paystack/
 *    - POST /api/paystack/webhook - Handle Paystack payment webhooks
 *
 * 4. CRON JOBS (Authorization: Bearer CRON_SECRET):
 *    /api/cron/send-reminders - Class/event reminder emails
 *    /api/cron/process-waitlist - Expire/promote waitlist entries
 *    /api/cron/subscriptions - Renewals and auto-resume
 *    /api/cron/payment-reminders - Membership expiry reminders
 *    /api/cron/reminders - Event reminder digests
 *    /api/cron/close-registrations - Auto-close event registrations
 *
 * 5. PUBLIC:
 *    /api/public/classes, /api/public/events, /api/public/plans, /api/public/trainers
 *    /api/contact - Contact form submissions
 *
 * 6. AUTH:
 *    /api/auth/login, verify-otp, forgot-password, reset-password, etc.
 *
 * DATA FLOW:
 * - Admin Dashboard → /api/members, /api/checkins, /api/analytics
 * - Member Dashboard → /api/member/dashboard
 * - Registration Form → /api/payment/initialize → /payment/callback → /payment/success
 * - Check-in System → /api/checkins (POST)
 */

export {};
