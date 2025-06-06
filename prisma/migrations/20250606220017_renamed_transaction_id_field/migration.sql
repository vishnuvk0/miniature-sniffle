/*
  Warnings:

  - You are about to drop the column `spendingTransactionId` on the `HistoryEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "HistoryEntry" DROP CONSTRAINT "HistoryEntry_spendingTransactionId_fkey";

-- DropIndex
DROP INDEX "HistoryEntry_spendingTransactionId_idx";

-- AlterTable
ALTER TABLE "HistoryEntry" DROP COLUMN "spendingTransactionId",
ADD COLUMN     "transactionId" TEXT;

-- CreateIndex
CREATE INDEX "HistoryEntry_transactionId_idx" ON "HistoryEntry"("transactionId");

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "SpendingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
