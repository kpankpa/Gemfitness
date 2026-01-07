-- AlterTable
ALTER TABLE "class_bookings" ADD COLUMN     "amountPaid" DOUBLE PRECISION,
ADD COLUMN     "paymentRef" TEXT,
ADD COLUMN     "paymentStatus" TEXT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "pending_event_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_event_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_class_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "bookedFor" TIMESTAMP(3) NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_class_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_event_bookings_paymentReference_key" ON "pending_event_bookings"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_event_bookings_userId_idx" ON "pending_event_bookings"("userId");

-- CreateIndex
CREATE INDEX "pending_event_bookings_eventId_idx" ON "pending_event_bookings"("eventId");

-- CreateIndex
CREATE INDEX "pending_event_bookings_paymentReference_idx" ON "pending_event_bookings"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_event_bookings_expiresAt_idx" ON "pending_event_bookings"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "pending_class_bookings_paymentReference_key" ON "pending_class_bookings"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_class_bookings_userId_idx" ON "pending_class_bookings"("userId");

-- CreateIndex
CREATE INDEX "pending_class_bookings_classId_idx" ON "pending_class_bookings"("classId");

-- CreateIndex
CREATE INDEX "pending_class_bookings_paymentReference_idx" ON "pending_class_bookings"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_class_bookings_expiresAt_idx" ON "pending_class_bookings"("expiresAt");

-- CreateIndex
CREATE INDEX "class_bookings_paymentStatus_idx" ON "class_bookings"("paymentStatus");
