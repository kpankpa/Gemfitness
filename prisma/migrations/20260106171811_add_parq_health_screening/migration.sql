-- AlterTable
ALTER TABLE "users" ADD COLUMN     "parqCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parqCompletedAt" TIMESTAMP(3),
ADD COLUMN     "parqRiskLevel" TEXT;

-- CreateTable
CREATE TABLE "parq_responses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "otherReasonDetails" TEXT,
    "riskLevel" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parq_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parq_responses_userId_idx" ON "parq_responses"("userId");

-- CreateIndex
CREATE INDEX "parq_responses_riskLevel_idx" ON "parq_responses"("riskLevel");

-- AddForeignKey
ALTER TABLE "parq_responses" ADD CONSTRAINT "parq_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
