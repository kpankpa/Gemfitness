# Database Migration for Advanced Features

## Overview

This migration adds support for the new advanced features in GemFitness:

- Event tickets with QR codes
- Event check-in system
- Registration deadline management
- Class cancellation system
- Payment transaction tracking

## Migration Commands

### 1. Generate Migration

```bash
npx prisma migrate dev --name "add_advanced_features"
```

### 2. Apply Migration

```bash
npx prisma migrate deploy
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

## New Tables Added

### EventTicket

- Stores QR tickets for paid events
- Includes security hash for validation
- Tracks check-in status

### EventCheckIn

- Records actual event attendance
- Links to tickets and users
- Tracks check-in method (QR vs manual)

### EventRegistrationDeadline

- Manages registration cutoff times
- Supports automatic closure
- Handles reminder notifications

### ClassCancellation

- Records cancelled classes
- Stores cancellation reasons
- Tracks alternative class suggestions

### PaymentTransaction

- Universal payment tracking
- Supports multiple payment methods
- Links to various entity types

## Schema Verification

After running the migration, verify the schema with:

```bash
npx prisma db pull
npx prisma validate
```

## Data Validation

Run the following queries to ensure the migration was successful:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('event_tickets', 'event_checkins', 'event_registration_deadlines', 'class_cancellations', 'payment_transactions');

-- Verify indexes were created
SELECT indexname, tablename FROM pg_indexes
WHERE tablename IN ('event_tickets', 'event_checkins', 'event_registration_deadlines', 'class_cancellations', 'payment_transactions');

-- Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('event_tickets', 'event_checkins', 'event_registration_deadlines', 'class_cancellations', 'payment_transactions');
```

## Rollback Plan

If rollback is needed, create a down migration:

```bash
npx prisma migrate resolve --rolled-back [migration-id]
```

Then manually drop the new tables:

```sql
DROP TABLE IF EXISTS payment_transactions;
DROP TABLE IF EXISTS class_cancellations;
DROP TABLE IF EXISTS event_registration_deadlines;
DROP TABLE IF EXISTS event_checkins;
DROP TABLE IF EXISTS event_tickets;
```

## Performance Considerations

### Indexes Added

- `event_tickets`: eventId, userId, ticketNumber, securityHash
- `event_checkins`: eventId, userId, checkInTime
- `event_registration_deadlines`: deadline, isActive
- `class_cancellations`: cancelledAt, cancelledBy
- `payment_transactions`: userId, reference, status, transactionType, paidAt

### Query Optimization

The new indexes support:

- Fast ticket lookup by QR code
- Efficient event check-in queries
- Quick deadline checks for cron jobs
- Performance payment transaction searches

## Testing After Migration

1. **Create a test event ticket**:

```typescript
const ticket = await prisma.eventTicket.create({
  data: {
    eventId: "test-event-id",
    userId: "test-user-id",
    ticketNumber: "TICK-001",
    qrCode: "qr-code-data",
    securityHash: "security-hash",
  },
});
```

2. **Test event check-in**:

```typescript
const checkIn = await prisma.eventCheckIn.create({
  data: {
    eventId: "test-event-id",
    ticketId: ticket.id,
    userId: "test-user-id",
    staffId: "staff-user-id",
    method: "qr",
  },
});
```

3. **Test deadline management**:

```typescript
const deadline = await prisma.eventRegistrationDeadline.create({
  data: {
    eventId: "test-event-id",
    deadline: new Date("2024-12-31T18:00:00Z"),
    autoClose: true,
    reminderHours: 24,
  },
});
```

## Environment Variables Required

Ensure these are set before running the migration:

```env
DATABASE_URL="your-database-connection-string"
PAYSTACK_SECRET_KEY="sk_test_cb53f7308d402e0906d8d714ea9927ed0cf06291"
PAYSTACK_PUBLIC_KEY="pk_test_b09cfa8996ae56391d703103fd0d68b6ac14b5b4"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_b09cfa8996ae56391d703103fd0d68b6ac14b5b4"
CRON_SECRET="your-cron-secret-key"
```

---

**Migration Status**: Ready for execution
**Estimated Duration**: 30 seconds
**Risk Level**: Low (additive changes only)
