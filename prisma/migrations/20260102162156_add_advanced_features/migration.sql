-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'CLASS_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'WAITLIST_SPOT_AVAILABLE';

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "notifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT,
    "type" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "schedule" TEXT NOT NULL,
    "color" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dashboardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "classReminders" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "waitlistNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "expiryWarnings" BOOLEAN NOT NULL DEFAULT true,
    "reminderHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waitlist_classId_idx" ON "waitlist"("classId");

-- CreateIndex
CREATE INDEX "waitlist_status_idx" ON "waitlist"("status");

-- CreateIndex
CREATE INDEX "waitlist_position_idx" ON "waitlist"("position");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_userId_classId_key" ON "waitlist"("userId", "classId");

-- CreateIndex
CREATE INDEX "class_templates_createdBy_idx" ON "class_templates"("createdBy");

-- CreateIndex
CREATE INDEX "class_templates_type_idx" ON "class_templates"("type");

-- CreateIndex
CREATE INDEX "class_reviews_classId_idx" ON "class_reviews"("classId");

-- CreateIndex
CREATE INDEX "class_reviews_rating_idx" ON "class_reviews"("rating");

-- CreateIndex
CREATE INDEX "class_reviews_status_idx" ON "class_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "class_reviews_userId_classId_key" ON "class_reviews"("userId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_templates" ADD CONSTRAINT "class_templates_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_reviews" ADD CONSTRAINT "class_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_reviews" ADD CONSTRAINT "class_reviews_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
