# GemFitness Advanced Features Documentation

## Overview

This document outlines the advanced features implemented for the GemFitness admin dashboard, including Classes and Events management enhancements.

## Features Implemented

### 1. Class Cancellation System

**Location**: `/api/classes/[id]/cancel`
**Purpose**: Cancel classes with automatic member notifications

**Features**:

- Cancel individual classes with reason
- Automatic member notification system
- Alternative class suggestions
- Database state management

**Usage**:

```typescript
POST /api/classes/{classId}/cancel
{
  "reason": "Instructor unavailable",
  "notifyMembers": true,
  "alternativeClasses": ["class-id-1", "class-id-2"]
}
```

### 2. QR Code Ticket Generation

**Location**: `/api/events/[id]/generate-tickets`
**Purpose**: Generate unique, secure QR tickets for paid events

**Features**:

- Unique ticket numbers with security hashes
- Batch ticket generation for multiple registrations
- QR code generation with embedded metadata
- Forgery protection with crypto-based validation

**Security Measures**:

- SHA-256 hash verification
- Unique ticket numbers
- Timestamp-based expiration
- Server-side validation

**Usage**:

```typescript
POST /api/events/{eventId}/generate-tickets
{
  "userIds": ["user1", "user2"],
  "ticketType": "STANDARD"
}
```

### 3. Event Check-in System

**Location**: `/api/events/[id]/checkin`
**Purpose**: Track actual attendance vs registrations with QR validation

**Features**:

- QR code scanning and validation
- Real-time attendance tracking
- Duplicate check-in prevention
- Manual check-in fallback
- Attendance statistics

**Validation Process**:

1. QR code scanned
2. Security hash verified
3. Ticket status checked
4. Check-in recorded with timestamp

**Usage**:

```typescript
POST /api/events/{eventId}/checkin
{
  "ticketId": "ticket-uuid",
  "method": "qr",
  "staffId": "staff-uuid"
}
```

### 4. Paystack Payment Integration

**Location**: `/lib/services/paystack.ts`
**Purpose**: Handle paid events with secure payment processing

**Components**:

- **PaystackService**: Server-side payment utilities
- **PaystackPayment**: Client-side payment component
- **Webhook Handling**: Payment verification and processing

**Environment Variables**:

```env
PAYSTACK_SECRET_KEY=sk_test_cb53f7308d402e0906d8d714ea9927ed0cf06291
PAYSTACK_PUBLIC_KEY=pk_test_b09cfa8996ae56391d703103fd0d68b6ac14b5b4
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_b09cfa8996ae56391d703103fd0d68b6ac14b5b4
```

**Features**:

- Payment initialization and verification
- Amount conversion utilities (toKobo/fromKobo)
- Reference generation
- Webhook signature validation
- Error handling and retry logic

### 5. Registration Deadline Management

**Location**: `/api/events/[id]/deadline`
**Purpose**: Auto-close registration before events with cron jobs

**Features**:

- Set registration deadlines
- Automatic closure with cron jobs
- Member reminder notifications
- Grace period handling
- Staff override capabilities

**Cron Job**: `/api/cron/close-registrations`

- Runs every hour to check deadlines
- Automatically closes expired registrations
- Sends final reminder notifications

**Usage**:

```typescript
POST /api/events/{eventId}/deadline
{
  "deadline": "2024-01-15T18:00:00Z",
  "autoClose": true,
  "reminderHours": 24
}
```

## Database Schema Enhancements

### New Tables/Fields Added:

**EventTickets Table**:

```sql
model EventTicket {
  id            String    @id @default(uuid())
  eventId       String
  userId        String
  ticketNumber  String    @unique
  qrCode        String
  securityHash  String
  checkedIn     Boolean   @default(false)
  checkInTime   DateTime?
  createdAt     DateTime  @default(now())
}
```

**EventCheckIns Table**:

```sql
model EventCheckIn {
  id          String   @id @default(uuid())
  eventId     String
  ticketId    String
  userId      String
  checkInTime DateTime @default(now())
  method      String   // 'qr' or 'manual'
  staffId     String
}
```

## UI Components

### Admin Dashboard Integration

**File**: `src/app/admin/dashboard/page.tsx`

**New Features Added**:

- Enhanced dropdown menus with advanced options
- Modal systems for all 5 features
- Real-time analytics and statistics
- Dynamic data integration (removed hardcoded values)
- Loading states and error handling

### Modal Components:

1. **Class Cancellation Modal**: Reason input, member notification toggle
2. **Event Deadline Modal**: DateTime picker, auto-close options
3. **Event Check-in Modal**: QR scanner, attendance statistics
4. **Payment Modal**: Paystack integration, amount display
5. **Ticket Generation Modal**: Batch processing, progress indicators

## Security Considerations

### QR Code Security:

- Hash-based validation prevents forgery
- Server-side verification required
- Timestamp-based expiration
- Unique ticket numbers

### Payment Security:

- Webhook signature validation
- Server-side payment verification
- Secure API key management
- Transaction logging

### Access Control:

- Staff role verification for check-ins
- Admin role required for cancellations
- Member authentication for payments
- Audit trail for all actions

## API Endpoints Summary

| Endpoint                            | Method | Purpose                          |
| ----------------------------------- | ------ | -------------------------------- |
| `/api/classes/{id}/cancel`          | POST   | Cancel class with notifications  |
| `/api/events/{id}/generate-tickets` | POST   | Generate QR tickets              |
| `/api/events/{id}/checkin`          | POST   | Process event check-ins          |
| `/api/events/{id}/deadline`         | POST   | Set registration deadlines       |
| `/api/cron/close-registrations`     | GET    | Auto-close expired registrations |
| `/api/paystack/webhook`             | POST   | Handle payment webhooks          |

## Testing

### Test Cards for Paystack:

- **Successful Transaction**: 4084084084084081
- **Declined Transaction**: 4084084084084081
- **Insufficient Funds**: 4084084084084081

### Test Environment:

All features are configured with test API keys and can be tested in development mode.

## Deployment Notes

### Environment Setup:

1. Copy environment variables to production
2. Update Paystack keys to live keys for production
3. Configure cron job scheduling
4. Set up webhook endpoints
5. Configure email service for notifications

### Database Migration:

Run Prisma migrations to create new tables:

```bash
npx prisma migrate deploy
```

### Monitoring:

- Payment transaction logs
- Check-in statistics
- Error tracking for failed operations
- Performance metrics for QR scanning

## Support and Maintenance

### Logging:

- All operations logged to database
- Error tracking with stack traces
- Performance monitoring
- User activity audit trails

### Backup and Recovery:

- Ticket data backup
- Payment transaction backup
- User check-in history
- Configuration settings backup

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
