-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('WORKSHOP', 'COMPETITION', 'SOCIAL', 'TRAINING', 'WELLNESS', 'CHARITY', 'CELEBRATION', 'SEMINAR', 'OTHER');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "category" "EventCategory",
ADD COLUMN     "earlyBirdDeadline" TIMESTAMP(3),
ADD COLUMN     "earlyBirdPrice" DOUBLE PRECISION,
ADD COLUMN     "tags" TEXT[];

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");
