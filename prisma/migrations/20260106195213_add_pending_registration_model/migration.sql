-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH';

-- CreateTable
CREATE TABLE "pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "emergencyContact" TEXT NOT NULL,
    "emergencyPhone" TEXT NOT NULL,
    "fitnessGoals" TEXT,
    "medicalConditions" TEXT,
    "hasHeartCondition" BOOLEAN NOT NULL DEFAULT false,
    "hasChestPain" BOOLEAN NOT NULL DEFAULT false,
    "hasDizziness" BOOLEAN NOT NULL DEFAULT false,
    "hasJointProblems" BOOLEAN NOT NULL DEFAULT false,
    "takesMedication" BOOLEAN NOT NULL DEFAULT false,
    "hasOtherConditions" BOOLEAN NOT NULL DEFAULT false,
    "otherConditionsDetails" TEXT,
    "plan" "MembershipPlan" NOT NULL,
    "registrationType" "RegistrationType" NOT NULL DEFAULT 'WALK_IN',
    "paymentMethod" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "momoReference" TEXT,
    "password" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_email_key" ON "pending_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_paymentReference_key" ON "pending_registrations"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_registrations_email_idx" ON "pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_paymentReference_idx" ON "pending_registrations"("paymentReference");

-- CreateIndex
CREATE INDEX "pending_registrations_paymentStatus_idx" ON "pending_registrations"("paymentStatus");

-- CreateIndex
CREATE INDEX "pending_registrations_expiresAt_idx" ON "pending_registrations"("expiresAt");
