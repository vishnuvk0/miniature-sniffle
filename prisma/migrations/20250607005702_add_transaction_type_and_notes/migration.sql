/*
  Warnings:

  - You are about to alter the column `balance` on the `HistoryEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `balance` on the `LoyaltyAccount` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `annualFee` on the `LoyaltyAccount` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `cpp` on the `SpendingTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `SpendingTransaction` table. All the data in the column will be lost.
  - Added the required column `reason` to the `SpendingTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SPEND', 'EARN');

-- AlterTable
ALTER TABLE "HistoryEntry" ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "LoyaltyAccount" ALTER COLUMN "balance" SET DATA TYPE INTEGER,
ALTER COLUMN "annualFee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "SpendingTransaction" DROP COLUMN "cpp",
DROP COLUMN "method",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "reason" TEXT NOT NULL DEFAULT 'Default Reason',
ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'SPEND',
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier", "token");

-- DropIndex
DROP INDEX "VerificationToken_identifier_token_key";
