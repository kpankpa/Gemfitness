# Paystack Integration Implementation Guide

**Gemfitness Gym Management System**

## 📚 Overview

This guide provides step-by-step instructions for completing the Paystack payment integration based on official Paystack best practices.

---

## 🎯 Integration Architecture

```
┌──────────────┐
│   Frontend   │ (Next.js App Router)
│  /signup     │
└──────┬───────┘
       │ 1. User fills form
       │ 2. POST /api/payment/initialize
       ▼
┌──────────────┐
│   Backend    │
│  API Routes  │
├──────────────┤
│ Initialize   │ → Paystack API (POST /transaction/initialize)
│ Verify       │ → Paystack API (GET /transaction/verify/:ref)
│ Webhook      │ ← Paystack sends events
└──────┬───────┘
       │ 3. Return access_code
       ▼
┌──────────────┐
│ Paystack JS  │ PaystackPop().resumeTransaction(access_code)
│ Inline Popup │
└──────┬───────┘
       │ 4. User pays
       │ 5. Webhook: charge.success
       ▼
┌──────────────┐
│  Database    │
│ Create User  │
│ Subscription │
│ Payment      │
└──────────────┘
```

---

## ✅ Current Status

### Completed ✅

- [x] `PaystackService` class (`src/lib/services/paystack.ts`)
- [x] Environment variables configured (`.env`)
- [x] Payment Settings UI in Admin Dashboard
- [x] TypeScript type definitions
- [x] **NEW: Webhook handler** (`/api/paystack/webhook/route.ts`)
- [x] **NEW: Payment initialization API** (`/api/payment/initialize/route.ts`)
- [x] **NEW: Payment verification API** (`/api/payment/verify/route.ts`)

### Pending ⏳

- [ ] Frontend Paystack Popup integration
- [ ] Subscription plans creation in Paystack
- [ ] Payment success/failure pages
- [ ] Settings API for Paystack config storage
- [ ] Auto-renewal cron job
- [ ] Enhanced audit logging

---

## 🚀 Step-by-Step Implementation

### **Step 1: Add Paystack Inline JS to Frontend**

**File: `src/app/signup/page.tsx`**

1. **Install Paystack Inline via npm:**

   ```bash
   npm install @paystack/inline-js
   ```

2. **Or add via CDN in layout:**

   ```tsx
   // src/app/layout.tsx
   <Script src="https://js.paystack.co/v2/inline.js" />
   ```

3. **Replace mock payment logic:**

```typescript
// Import
import PaystackPop from "@paystack/inline-js";

// In handleSubmit function, replace mock payment with:
const handlePayment = async () => {
  setIsSubmitting(true);
  setError("");

  try {
    // Step 1: Initialize payment on backend
    const response = await fetch("/api/payment/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        amount: totalAmount, // e.g., 450 (200 + 250)
        metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          emergency_contact: formData.emergencyContact,
          emergency_phone: formData.emergencyPhone,
          fitness_goals: formData.fitnessGoals,
          medical_conditions: formData.medicalConditions,
          plan: selectedPlan, // 'monthly', 'quarterly', 'annual'
        },
        plan: selectedPlan,
      }),
    });

    const { access_code, reference } = await response.json();

    // Step 2: Open Paystack popup
    const popup = new PaystackPop();
    popup.resumeTransaction(access_code, {
      onSuccess: async (transaction) => {
        console.log("Payment successful!", transaction);

        // Step 3: Verify payment
        const verifyResponse = await fetch(
          `/api/payment/verify?reference=${reference}`
        );
        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          // Redirect to success page
          router.push(`/signup/success?reference=${reference}`);
        } else {
          setError("Payment verification failed. Please contact support.");
        }
      },
      onCancel: () => {
        setError("Payment was cancelled");
        setIsSubmitting(false);
      },
      onError: (error) => {
        console.error("Payment error:", error);
        setError("Payment failed. Please try again.");
        setIsSubmitting(false);
      },
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    setError("Failed to start payment. Please try again.");
    setIsSubmitting(false);
  }
};
```

---

### **Step 2: Create Subscription Plans in Paystack**

**Option A: Via Paystack Dashboard**

1. Go to https://dashboard.paystack.com/#/plans
2. Click "Create Plan"
3. Create three plans:
   - **Monthly Plan**: GH₵200/month
   - **Quarterly Plan**: GH₵500 every 3 months
   - **Annual Plan**: GH₵2200/year
4. Copy plan codes (e.g., `PLN_xxxxxx`)

**Option B: Via API (Programmatic)**

```typescript
// Create a script: scripts/create-plans.ts
import { paystackService } from "@/lib/services/paystack";

async function createPlans() {
  const plans = [
    {
      name: "Monthly Membership",
      amount: 20000, // GH₵200 in kobo
      interval: "monthly",
    },
    {
      name: "Quarterly Membership",
      amount: 50000, // GH₵500 in kobo
      interval: "quarterly",
    },
    {
      name: "Annual Membership",
      amount: 220000, // GH₵2200 in kobo
      interval: "annually",
    },
  ];

  for (const plan of plans) {
    const response = await fetch("https://api.paystack.co/plan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    });

    const result = await response.json();
    console.log(`✅ Created plan: ${plan.name}`, result.data.plan_code);
  }
}

createPlans();
```

**Run:** `npx ts-node scripts/create-plans.ts`

---

### **Step 3: Configure Webhook URL**

1. Go to https://dashboard.paystack.com/#/settings/developer
2. Add webhook URL: `https://your-domain.com/api/paystack/webhook`
3. For local development:

   - Use **ngrok**: `ngrok http 3000`
   - Copy HTTPS URL: `https://xxxx.ngrok.io/api/paystack/webhook`
   - Add to Paystack dashboard (test mode)

4. **Test webhook locally:**

   ```bash
   # Terminal 1: Start Next.js
   npm run dev

   # Terminal 2: Start ngrok
   ngrok http 3000

   # Use ngrok URL in Paystack dashboard
   ```

---

### **Step 4: Update Signup Flow for Recurring Subscriptions**

**For automatic renewals, pass `plan_code` to Paystack:**

```typescript
// In /api/payment/initialize/route.ts
export async function POST(request: NextRequest) {
  const { email, amount, metadata, plan } = await request.json();

  // Map plan to Paystack plan codes (from Step 2)
  const planCodes = {
    monthly: "PLN_monthly_xxxxx",
    quarterly: "PLN_quarterly_xxxxx",
    annual: "PLN_annual_xxxxx",
  };

  const response = await paystackService.initializePayment({
    email,
    amount: paystackService.toKobo(250), // Registration fee only
    reference: paystackService.generateReference("GYM"),
    plan: planCodes[plan], // ← This enables subscription
    metadata,
  });

  // Return response...
}
```

**How it works:**

- User pays GH₵250 (registration) + GH₵200 (first month) = GH₵450
- Paystack creates subscription automatically
- Future payments use saved card authorization
- Webhook receives `subscription.create` event
- Monthly charges happen automatically

---

### **Step 5: Handle Subscription Renewals**

**Listen for webhook events:**

The webhook handler already supports:

- ✅ `charge.success` - Initial payment
- ✅ `subscription.create` - Subscription created
- ✅ `invoice.create` - 3 days before renewal
- ✅ `invoice.payment_failed` - Payment failed
- ✅ `subscription.disable` - Cancelled/completed

**Update subscription status in database:**

```typescript
// Add to webhook handler
case 'subscription.disable':
  await prisma.subscription.update({
    where: { paystackSubscriptionCode: data.subscription_code },
    data: {
      status: data.status === 'complete' ? 'EXPIRED' : 'CANCELLED',
      endDate: new Date(),
    },
  });
  break;

case 'invoice.payment_failed':
  // Update member status to ATTENTION
  const subscription = await prisma.subscription.findFirst({
    where: { paystackSubscriptionCode: data.subscription_code },
  });

  await prisma.user.update({
    where: { id: subscription.userId },
    data: { status: 'suspended' }, // Add status field to User model
  });

  // Send email notification
  break;
```

---

### **Step 6: Create Success Page**

**File: `src/app/payment/success/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!reference) {
      router.push("/signup");
      return;
    }

    // Verify payment on page load (IMPORTANT!)
    fetch(`/api/payment/verify?reference=${reference}`)
      .then((res) => res.json())
      .then((data) => {
        setIsVerifying(false);
        if (data.success) {
          setVerified(true);
        } else {
          router.push(`/payment/failed?reference=${reference}`);
        }
      });
  }, [reference]);

  if (isVerifying) {
    return <div>Verifying payment...</div>;
  }

  if (!verified) {
    return <div>Verification failed</div>;
  }

  return (
    <div className="success-container">
      <h1>✅ Payment Successful!</h1>
      <p>Your membership is now active</p>
      <p>Reference: {reference}</p>
      <button onClick={() => router.push("/login")}>Go to Login</button>
    </div>
  );
}
```

---

## 🔒 Security Best Practices

### ✅ **DO:**

1. **Verify webhook signatures** using HMAC SHA512 (already implemented)
2. **Always verify payments** on your server before delivering value
3. **Check the amount** matches your product price
4. **Return 200 OK immediately** from webhook endpoint
5. **Use HTTPS** for webhook URL (Paystack requirement)
6. **Store authorization codes** securely for recurring payments
7. **Implement idempotency** - check if payment already processed

### ❌ **DON'T:**

1. **Never expose secret keys** on frontend
2. **Don't trust client-side success** messages
3. **Don't use polling** instead of webhooks
4. **Don't deliver value** before webhook confirmation
5. **Don't store full card details** (Paystack handles this)
6. **Don't skip amount verification** (fraud prevention)
7. **Don't use long-running tasks** in webhook handler

---

## 🧪 Testing Checklist

### Test Mode (Using Test Keys)

- [ ] Initialize payment succeeds
- [ ] Paystack popup opens correctly
- [ ] Test card works: `5060666666666666` CVV: `123` PIN: `1234`
- [ ] Webhook receives `charge.success` event
- [ ] User account created successfully
- [ ] Subscription record created
- [ ] QR code generated
- [ ] Welcome email sent
- [ ] Payment record saved
- [ ] Success page displays correctly

### Test Card Details:

```
Card Number: 5060 6666 6666 6666
CVV: 123
PIN: 1234
Expiry: Any future date
OTP: 123456
```

### Webhook Testing:

```bash
# Use Paystack's test webhook tool
curl -X POST https://your-domain.com/api/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: YOUR_TEST_SIGNATURE" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "TEST_REF_123",
      "amount": 45000,
      "customer": { "email": "test@example.com" },
      "status": "success"
    }
  }'
```

---

## 📊 Database Schema Updates Needed

**Add to Prisma schema:**

```prisma
model Subscription {
  // ... existing fields
  paystackSubscriptionCode String? @unique
  paystackAuthorizationCode String? // For recurring charges
  nextPaymentDate DateTime?
}

model User {
  // ... existing fields
  status String @default("active") // active, suspended, cancelled
}

model Transaction {
  id String @id @default(cuid())
  reference String @unique
  amount Decimal
  status String // pending, success, failed
  paystackReference String?
  metadata Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId String?
  subscriptionId String?
}
```

**Run migration:**

```bash
npx prisma migrate dev --name add_paystack_fields
```

---

## 🔄 Payment Flow States

```
REGISTRATION PAYMENT:
pending → processing → success/failed

SUBSCRIPTION LIFECYCLE:
active → (payment issue) → attention → (resolved) → active
      → (cancelled) → non-renewing → disabled
      → (completed) → disabled
```

---

## 📧 Email Notifications to Implement

1. **Registration Success** - Welcome email with QR code
2. **Payment Reminder** - 3 days before renewal (from `invoice.create`)
3. **Payment Success** - Monthly renewal confirmation
4. **Payment Failed** - Update payment method link
5. **Subscription Cancelled** - Confirmation email
6. **Subscription Expiring** - Reminder to renew

---

## 🎯 Next Steps

1. **Update todo status** as you complete each item
2. **Test in development** with Paystack test keys
3. **Test webhook** using ngrok
4. **Switch to live keys** only after thorough testing
5. **Monitor webhook logs** in production
6. **Set up alerts** for failed payments

---

## 📞 Support Resources

- **Paystack Documentation**: https://paystack.com/docs/
- **Paystack Dashboard**: https://dashboard.paystack.com/
- **Paystack Support**: support@paystack.com
- **Paystack Slack Community**: https://payslack.com/

---

## ⚡ Quick Reference

### Test API Keys (Ghana)

```env
PAYSTACK_PUBLIC_KEY="pk_test_b09cfa8996ae56391d703103fd0d68b6ac14b5b4"
PAYSTACK_SECRET_KEY="sk_test_cb53f7308d402e0906d8d714ea9927ed0cf06291"
```

### Paystack API Endpoints

```
Initialize: POST https://api.paystack.co/transaction/initialize
Verify: GET https://api.paystack.co/transaction/verify/:reference
Create Plan: POST https://api.paystack.co/plan
Create Subscription: POST https://api.paystack.co/subscription
```

### Webhook IP Whitelist

```
52.31.139.75
52.49.173.169
52.214.14.220
```

---

**Last Updated**: January 3, 2026
**Version**: 1.0
