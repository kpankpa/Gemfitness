# GemFitness Dashboard — Requirements

Last updated: 2025-12-22

This document captures functional and non-functional requirements inferred from the current dashboard UI and codebase. It is intended to serve as a single-source specification for developers, testers, and product owners.

## 1. Overview

- The dashboard provides role-aware interfaces for Members, Receptionists, Managers, and Admins.
- Main functional domains: check-ins, member management, subscriptions/payments, events & classes, analytics, staff management, and registration.
- Authentication is cookie-based JWT sessions (`/api/auth/*`), with middleware enforcing route-level access.

## 2. User Roles & Permissions

- MEMBER: access to ` /dashboard/member` — view personal profile, QR code, subscriptions, events, activity, achievements.
- RECEPTIONIST: access to ` /dashboard/receptionist` — perform check-ins (scanner + manual), preview member data, register walk-ins, handle registration fees.
- MANAGER: access to ` /dashboard/manager` — all receptionist capabilities plus reporting, plans, and limited staff management.
- ADMIN: access to ` /dashboard/admin` — full system administration: members, staff, plans, payments, analytics, events, migrations.
- Enforcement: `src/middleware.ts` maps protected routes and redirects or returns 401/403 as needed.

## 3. Pages & Key UI Elements

- `Member Dashboard` (src/app/dashboard/member/page.tsx)

  - Header with greeting and logout
  - Stats cards: Current streak, Total visits, Best streak, Days left
  - Weekly activity and achievements
  - Attendance heatmap (last 30 days)
  - Profile card with contact & emergency info
  - QR Code card (`QRCodeDisplay` component)
  - Subscription card (active / no-membership states)
  - Upcoming events and recent activity

- `Admin Dashboard` (src/app/admin/dashboard/page.tsx)

  - Tabs: overview, checkin, members, classes, events, attendance, payments, plans, staff, analytics
  - QR scanner components: `QRScanner`, `WebcamQRScanner` for receptionist/admin check-in flows
  - Members list and CRUD modals
  - Staff management modals (add/edit/delete)
  - Plans and registration fees management
  - Auto-refresh for check-ins when on check-in tab

- Shared UI components
  - `QRCodeDisplay.tsx`, `QRScanner.tsx`, `WebcamQRScanner.tsx`, `AdminSidebar.tsx`, design system components in `src/components/ui/*`.

## 4. Data Models (high level)

- `User` / `Member`: id, firstName, lastName, email, phone, role, qrCode, registrationPaid, registrationType, createdAt, memberSince, profileImage, subscriptions, checkIns.
- `Subscription`: id, userId, plan, status, amount, startDate, endDate.
- `CheckIn`: id, userId, checkInTime, method (qr|manual), checkedBy.
- `Event`, `Class`, `Payment` model shapes are present in code and used by dashboards.

(Types available in `src/types/index.ts`)

## 5. API Endpoints (observed & relevant)

- `GET /api/checkins/lookup?qr=` — staff-only endpoint returning member summary, membership status, and last check-in.
- `POST /api/checkins` — create a check-in (accepts `userId` or `qrCode`) with duplicate prevention and subscription checks.
- `GET /api/events` — returns upcoming and ongoing events for member dashboard.
- `GET /api/members`, `POST /api/members` etc. — used by admin members page (via `useMembers` hook).
- `Auth routes` — `/api/auth/login`, `/api/auth/logout`, `/api/auth/signup`, session handled in `src/lib/auth/session.ts`.

Notes: Some endpoints have in-memory rate-limiting utilities (`src/lib/rateLimiter.ts`) and a plan to replace with Redis-backed limiter.

## 6. Primary User Flows

- QR Check-in (Receptionist):

  1. Receptionist logs in (RECEPTIONIST role).
  2. Uses camera or uploads QR in `QRScanner` (`/api/checkins/lookup` preview).
  3. Server validates QR token and returns member summary. Receptionist confirms to POST `/api/checkins`.
  4. System records `checkedBy` (receptionist id), prevents duplicate check-ins within configured window.

- Manual Check-in / Walk-in Registration (Receptionist):

  - Search members, create quick-registration, optionally generate QR and print registration receipt.

- Member Self-View (Member):

  - View QR code, subscription details, attendance heatmap, achievements, and register for events.

- Admin Operations:
  - Manage members, staff, plans, registration fees, view analytics, export data, and run migrations.

## 7. Non-functional Requirements

- Security

  - Session-based auth with signed JWT session cookie; server-side middleware enforces protected routes.
  - Staff-only endpoints must be protected to prevent enumeration (implemented for `/api/checkins/lookup`).
  - Avoid logging raw `qr` tokens; mask or omit tokens in logs.

- Performance & Scalability

  - Receptionist check-in path must support high throughput during peak times — staff fast-checkin/bulk endpoints planned.
  - Replace in-memory rate limiter with Redis to provide consistent limits across instances.

- Reliability
  - Duplicate check-in prevention to avoid multiple entries within a short window.
  - Migrations and migration scripts exist under `prisma/` and `scripts/` (e.g., QR migration).

## 8. Acceptance Criteria (per feature)

- Member Dashboard

  - Loads within 1s on warm cache for authenticated member.
  - Displays correct active subscription and days left.
  - QR code displays and is downloadable.

- Receptionist Lookup & Check-in

  - `/api/checkins/lookup` returns 401 for no session, 403 for non-staff, 200 for staff with valid member data.
  - Check-in recorded includes `checkedBy` and `method` fields.
  - Duplicate prevention: second check-in within 30 minutes returns a duplicate warning instead of creating a new record unless forced.

- Admin
  - Staff management: Admin can add/edit/remove staff; new staff can log in and access protected admin routes.

## 9. Tests & QA

- Unit tests for QR utils (`src/lib/qr/generator.ts`) exist; add integration tests for the lookup guard:
  - No session → 401
  - Non-staff session → 403
  - Staff session + valid QR → 200 + payload
- End-to-end test for receptionist flow (lookup → confirm check-in) covering audit fields and duplicate prevention.

## 10. Known Issues & Risks

- `verifySession()` is cached via React `cache()` and may create stale cross-request sessions when used in API routes. A non-cached `verifySessionForApi()` should be used for per-request checks (there is now an implementation in `src/lib/auth/dal.ts`).
- Public enumeration risk mitigated by gating `/api/checkins/lookup` to staff only; confirm all clients handle 401/403 gracefully.
- In-memory rate limiter is not resilient across instances; plan to replace with Redis.

## 11. Next Steps & Improvements

- Implement Redis-backed, staff-aware rate limiting for public endpoints.
- Add staff `fast-checkin` and `bulk-checkin` endpoints with per-QR anti-replay windows and audit logging.
- Create integration test suite covering authentication guards and receptionist workflows.
- Improve client UX: show clear toasts for 401/403 in `QRScanner` and admin check-in views.
- Harden logging: never log raw QR tokens; mask in any error messages.

## 12. References (code locations)

- Middleware & route protection: `src/middleware.ts`
- Member dashboard: `src/app/dashboard/member/page.tsx`
- Admin dashboard: `src/app/admin/dashboard/page.tsx`
- QR components: `src/components/QRScanner.tsx`, `src/components/WebcamQRScanner.tsx`, `src/components/QRCodeDisplay.tsx`
- API: `src/app/api/checkins/route.ts`, `src/app/api/checkins/lookup/route.ts`, `src/app/api/members` (various)
- Types: `src/types/index.ts`
- Auth helpers: `src/lib/auth/session.ts`, `src/lib/auth/dal.ts`, `src/lib/auth/permissions.ts`
- Rate limiter: `src/lib/rateLimiter.ts`

---

If you want, I can:

- Add the acceptance/integration tests for the lookup guard now.
- Create a short PR with the Redis-backed rate limiter scaffold.
- Update `QRScanner` to show explicit toasts for 401/403.

Tell me which follow-up you'd like next and I'll add it to the TODOs and implement it.
