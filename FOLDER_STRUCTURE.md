# 📁 GemFitness Project Structure

## Overview

This document explains the complete folder structure and the purpose of each directory.

```
gemfiness/
├── prisma/                          # Database schema & migrations
│   ├── schema.prisma               # Database models (User, Subscription, etc.)
│   ├── migrations/                 # Auto-generated SQL files
│   └── seed.ts                     # Initial data (roles, test users)
│
├── src/                            # All source code
│   ├── app/                        # Next.js App Router (pages & routes)
│   │   ├── (public)/              # Public website (landing, pricing, login)
│   │   │   ├── page.tsx           # Homepage: gemfitness.com/
│   │   │   ├── pricing/           # Pricing: gemfitness.com/pricing
│   │   │   ├── login/             # Login: gemfitness.com/login
│   │   │   ├── signup/            # Signup: gemfitness.com/signup
│   │   │   └── layout.tsx         # Shared layout for public pages
│   │   │
│   │   ├── (member)/              # Member dashboard (protected)
│   │   │   ├── dashboard/         # Member home: gemfitness.com/dashboard
│   │   │   ├── subscription/      # View subscription
│   │   │   ├── profile/           # Edit profile
│   │   │   └── layout.tsx         # Member dashboard layout
│   │   │
│   │   ├── (admin)/               # Staff dashboard (receptionist/manager)
│   │   │   ├── dashboard/         # Admin home: admin.gemfitness.com/
│   │   │   ├── check-in/          # QR check-in screen
│   │   │   ├── members/           # Manage members
│   │   │   ├── reports/           # Analytics & reports
│   │   │   └── layout.tsx         # Admin dashboard layout
│   │   │
│   │   ├── api/                   # API Routes (backend endpoints)
│   │   │   ├── paystack/
│   │   │   │   └── webhook/route.ts    # Paystack payment webhook
│   │   │   └── cron/
│   │   │       └── expire-subscriptions/route.ts  # Daily expiry job
│   │   │
│   │   ├── globals.css            # Global styles
│   │   └── layout.tsx             # Root layout (wraps all pages)
│   │
│   ├── actions/                   # Server Actions (database operations)
│   │   ├── members.ts             # Create/update/delete members
│   │   ├── subscriptions.ts       # Subscription management
│   │   ├── check-ins.ts           # Log member check-ins
│   │   └── auth.ts                # Login/logout actions
│   │
│   ├── lib/                       # Utility functions & helpers
│   │   ├── prisma.ts              # Prisma Client singleton
│   │   ├── email.ts               # Email functions (Resend)
│   │   ├── qr.ts                  # QR code generation/validation
│   │   ├── utils.ts               # General utilities
│   │   └── constants.ts           # App constants
│   │
│   └── components/                # React components
│       ├── ui/                    # Base UI (buttons, cards, modals)
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── ...                # shadcn/ui components
│       │
│       └── email-templates/       # Email designs
│           ├── expiry-warning.tsx
│           └── welcome.tsx
│
├── public/                        # Static files (images, fonts)
│   ├── logo.svg
│   └── images/
│
├── auth.ts                        # NextAuth configuration
├── middleware.ts                  # Subdomain routing & auth protection
├── .env                           # Environment variables (secrets)
├── .env.example                   # Template for .env file
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── next.config.ts                 # Next.js config
```

---

## 🎯 Key Concepts

### Route Groups: `(folder)`

Folders with parentheses are **Route Groups**. They organize code WITHOUT affecting the URL.

**Example:**

- `src/app/(public)/pricing/page.tsx` → URL: `/pricing` (not `/public/pricing`)

### Special Files

- `page.tsx` - Becomes a route
- `layout.tsx` - Wraps child pages (shared UI)
- `loading.tsx` - Loading state
- `error.tsx` - Error boundary
- `route.ts` - API endpoint

### Why This Structure?

1. **`src/` folder**: Keeps root clean, Next.js standard
2. **Route groups**: Organize by access level (public/member/admin)
3. **Separate `actions/`**: Server Actions must be in separate files
4. **`lib/` utilities**: Prevent code duplication
5. **Root-level `auth.ts` & `middleware.ts`**: Next.js/NextAuth convention

---

## 🔐 Security Notes

### Never Commit:

- `.env` (contains secrets)
- `node_modules/`
- `.next/` (build output)

### Protect in Code:

- Admin routes require `role === "manager" || "receptionist"`
- Member routes require authentication
- Webhook routes verify signature

---

## 🚀 URL Structure

### Public Site (gymfitness.com)

- `/` - Landing page
- `/pricing` - Plans
- `/login` - Member/staff login
- `/signup` - New member registration

### Member Portal (gymfitness.com)

- `/dashboard` - Member home
- `/subscription` - View membership
- `/profile` - Edit profile

### Admin Portal (admin.gymfitness.com)

- `/` - Dashboard (via middleware rewrite)
- `/check-in` - QR scanner
- `/members` - Member management
- `/reports` - Analytics

### API Routes

- `/api/paystack/webhook` - Payment notifications
- `/api/cron/expire-subscriptions` - Daily job (Vercel Cron)

---

## 📝 Next Steps

1. ✅ Folder structure created
2. ⏳ Create Prisma schema
3. ⏳ Set up NextAuth
4. ⏳ Create first Server Action
5. ⏳ Build check-in system
