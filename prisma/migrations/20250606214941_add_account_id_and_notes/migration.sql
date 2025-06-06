/*
  Warnings:

  - You are about to drop the column `accountIdNumber` on the `LoyaltyAccount` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `LoyaltyAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LoyaltyAccount" DROP COLUMN "accountIdNumber",
DROP COLUMN "notes";
