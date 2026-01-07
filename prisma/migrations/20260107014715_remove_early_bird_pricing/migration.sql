/*
  Warnings:

  - You are about to drop the column `earlyBirdDeadline` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `earlyBirdPrice` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "earlyBirdDeadline",
DROP COLUMN "earlyBirdPrice";
