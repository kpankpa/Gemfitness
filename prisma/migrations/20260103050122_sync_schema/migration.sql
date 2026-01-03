/*
  Warnings:

  - A unique constraint covering the columns `[ticketId]` on the table `event_bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `event_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CLASS_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CANCELLED';

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- AlterTable
ALTER TABLE "event_bookings" ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "ticketGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "ticketId" TEXT,
ADD COLUMN     "ticketQRData" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "autoCloseRegistration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "registrationClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "securityHash" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkInTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_checkins" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registration_deadlines" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "autoClose" BOOLEAN NOT NULL DEFAULT true,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_cancellations" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "alternativeClasses" TEXT[],
    "membersNotified" BOOLEAN NOT NULL DEFAULT false,
    "cancelledBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "paymentGatewayId" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_ticketNumber_key" ON "event_tickets"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "event_tickets_qrCode_key" ON "event_tickets"("qrCode");

-- CreateIndex
CREATE INDEX "event_tickets_eventId_idx" ON "event_tickets"("eventId");

-- CreateIndex
CREATE INDEX "event_tickets_userId_idx" ON "event_tickets"("userId");

-- CreateIndex
CREATE INDEX "event_tickets_ticketNumber_idx" ON "event_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "event_tickets_securityHash_idx" ON "event_tickets"("securityHash");

-- CreateIndex
CREATE INDEX "event_checkins_eventId_idx" ON "event_checkins"("eventId");

-- CreateIndex
CREATE INDEX "event_checkins_userId_idx" ON "event_checkins"("userId");

-- CreateIndex
CREATE INDEX "event_checkins_checkInTime_idx" ON "event_checkins"("checkInTime");

-- CreateIndex
CREATE UNIQUE INDEX "event_checkins_ticketId_key" ON "event_checkins"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_deadlines_eventId_key" ON "event_registration_deadlines"("eventId");

-- CreateIndex
CREATE INDEX "event_registration_deadlines_deadline_idx" ON "event_registration_deadlines"("deadline");

-- CreateIndex
CREATE INDEX "event_registration_deadlines_isActive_idx" ON "event_registration_deadlines"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "class_cancellations_classId_key" ON "class_cancellations"("classId");

-- CreateIndex
CREATE INDEX "class_cancellations_cancelledAt_idx" ON "class_cancellations"("cancelledAt");

-- CreateIndex
CREATE INDEX "class_cancellations_cancelledBy_idx" ON "class_cancellations"("cancelledBy");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_reference_key" ON "payment_transactions"("reference");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_idx" ON "payment_transactions"("userId");

-- CreateIndex
CREATE INDEX "payment_transactions_reference_idx" ON "payment_transactions"("reference");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_transactionType_idx" ON "payment_transactions"("transactionType");

-- CreateIndex
CREATE INDEX "payment_transactions_paidAt_idx" ON "payment_transactions"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_bookings_ticketId_key" ON "event_bookings"("ticketId");

-- CreateIndex
CREATE INDEX "event_bookings_ticketId_idx" ON "event_bookings"("ticketId");

-- CreateIndex
CREATE INDEX "event_bookings_checkedIn_idx" ON "event_bookings"("checkedIn");

-- CreateIndex
CREATE INDEX "event_bookings_paymentStatus_idx" ON "event_bookings"("paymentStatus");

-- CreateIndex
CREATE INDEX "events_registrationDeadline_idx" ON "events"("registrationDeadline");

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checkins" ADD CONSTRAINT "event_checkins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checkins" ADD CONSTRAINT "event_checkins_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "event_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checkins" ADD CONSTRAINT "event_checkins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checkins" ADD CONSTRAINT "event_checkins_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_deadlines" ADD CONSTRAINT "event_registration_deadlines_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_cancellations" ADD CONSTRAINT "class_cancellations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_cancellations" ADD CONSTRAINT "class_cancellations_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
