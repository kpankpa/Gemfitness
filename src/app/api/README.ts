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
 * 3. FUTURE PAYMENT OPERATIONS:
 *    /api/paystack/ (to be implemented)
 *    - POST /api/paystack/initialize - Initialize payment
 *    - POST /api/paystack/webhook   - Handle payment webhooks
 * 
 * 4. FUTURE CRON JOBS:
 *    /api/cron/ (to be implemented)
 *    - POST /api/cron/check-expiry - Check and update expired subscriptions
 * 
 * DATA FLOW:
 * - Admin Dashboard → /api/members, /api/checkins, /api/analytics
 * - Member Dashboard → /api/member/dashboard
 * - Registration Form → /api/members (POST)
 * - Check-in System → /api/checkins (POST)
 * - QR Scanner → /api/checkins (POST)
 */

export {};