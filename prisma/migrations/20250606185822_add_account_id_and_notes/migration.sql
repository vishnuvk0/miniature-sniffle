-- AlterTable
ALTER TABLE "HistoryEntry" ADD COLUMN     "spendingTransactionId" TEXT;

-- AlterTable
ALTER TABLE "LoyaltyAccount" ADD COLUMN     "accountIdNumber" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "HistoryEntry_spendingTransactionId_idx" ON "HistoryEntry"("spendingTransactionId");

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_spendingTransactionId_fkey" FOREIGN KEY ("spendingTransactionId") REFERENCES "SpendingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
