import { InsufficientBalanceError } from './spend-logic'; // Re-using error type for consistency

export async function createEarnLogic(tx: any, accountId: string, userId: string, earnData: any) {
    const { pointsEarned, reason, notes, date } = earnData;
    const earnDate = new Date(date);

    // 1. Get the account
    const account = await tx.loyaltyAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      throw new Error('Account not found or access denied.');
    }

    // 2. Find balance at earn date
    const historyBeforeEarn = await tx.historyEntry.findFirst({
      where: { loyaltyAccountId: accountId, date: { lte: earnDate } },
      orderBy: { date: 'desc' },
    });
    const balanceAtEarn = historyBeforeEarn ? historyBeforeEarn.balance : 0;

    // 3. Create the transaction record
    const earnTransaction = await tx.spendingTransaction.create({
      data: {
        loyaltyAccountId: accountId,
        pointsUsed: pointsEarned, // Storing as a positive number
        type: 'EARN',
        reason,
        notes,
        date: earnDate,
      },
    });

    // 4. Create a new history entry for the credit
    await tx.historyEntry.create({
      data: {
        loyaltyAccountId: accountId,
        balance: balanceAtEarn + pointsEarned,
        date: earnDate,
        reason: `Earned: ${reason}`,
        transactionId: earnTransaction.id
      },
    });

    // 5. Update all subsequent history entries
    await tx.historyEntry.updateMany({
      where: {
        loyaltyAccountId: accountId,
        date: { gt: earnDate },
      },
      data: {
        balance: { increment: pointsEarned },
      },
    });

    // 6. Update the main account balance to the latest history entry
    const latestHistoryEntry = await tx.historyEntry.findFirst({
      where: { loyaltyAccountId: accountId },
      orderBy: { date: 'desc' },
    });

    await tx.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        balance: latestHistoryEntry ? latestHistoryEntry.balance : 0,
        date: latestHistoryEntry ? latestHistoryEntry.date : new Date(),
      },
    });

    // 7. Return the fully updated account
    return tx.loyaltyAccount.findUnique({
      where: { id: accountId },
      include: {
        history: { orderBy: { date: 'desc' } },
        spending: { orderBy: { date: 'desc' } },
      }
    });
} 