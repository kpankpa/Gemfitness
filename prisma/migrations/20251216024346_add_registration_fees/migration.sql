-- CreateTable
CREATE TABLE "registration_fees" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "maxMembers" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'GH₵',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_fees_type_key" ON "registration_fees"("type");

-- CreateIndex
CREATE INDEX "registration_fees_type_idx" ON "registration_fees"("type");

-- CreateIndex
CREATE INDEX "registration_fees_status_idx" ON "registration_fees"("status");
