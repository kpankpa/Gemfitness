-- AlterTable
ALTER TABLE "check_ins" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "currentBookings" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "paymentReference" TEXT,
ADD COLUMN     "profileImage" TEXT;
