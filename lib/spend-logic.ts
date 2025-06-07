import { prisma } from './prisma';

export class InsufficientBalanceError extends Error {
    public errorCode: string;
    constructor(message: string, errorCode: string) {
      super(message);
      this.name = 'InsufficientBalanceError';
      this.errorCode = errorCode;
    }
}

export async function createSpendLogic(tx: any, sendingAccountId: string, userId: string, spendData: any) {
    const { pointsUsed, reason, partnerName, transferBonus, date, notes } = spendData;
    const spendDate = new Date(date);

    // 1. Get sending account and its latest entry
    const sendingAccount = await tx.loyaltyAccount.findUnique({
      where: { id: sendingAccountId },
      include: { history: { orderBy: { date: 'desc' }, take: 1 } }
    });

    if (!sendingAccount || sendingAccount.userId !== userId) {
      throw new Error('Account not found or access denied.');
    }

    const latestEntry = sendingAccount.history[0];
    const isRetroactive = latestEntry && spendDate < latestEntry.date;

    // Find balance at spend date
    const historyBeforeSpend = await tx.historyEntry.findFirst({
      where: { loyaltyAccountId: sendingAccountId, date: { lte: spendDate } },
      orderBy: { date: 'desc' },
    });
    let balanceAtSpend = historyBeforeSpend ? historyBeforeSpend.balance : 0;
    let subsequentUpdateNeeded = true; 

    // 2. Adjust balances for retroactive spending
    if (isRetroactive) {
      if (historyBeforeSpend) {
          // Case: Spend is IN-BETWEEN existing entries.
          // Increment all entries to preserve final balance, then create the debit.
          await tx.historyEntry.updateMany({
              where: { loyaltyAccountId: sendingAccountId },
              data: { balance: { increment: pointsUsed } },
          });
          // Refetch balance at spend date, which is now higher.
          const adjustedHistoryBeforeSpend = await tx.historyEntry.findFirst({
              where: { loyaltyAccountId: sendingAccountId, date: { lte: spendDate } },
              orderBy: { date: 'desc' },
          });
          balanceAtSpend = adjustedHistoryBeforeSpend!.balance;
      } else {
          // Case: Spend is BEFORE ALL existing entries.
          const nextEntry = await tx.historyEntry.findFirst({
            where: { loyaltyAccountId: sendingAccountId, date: { gt: spendDate } },
            orderBy: { date: 'asc' },
          });

          if (nextEntry) {
            const inferredBalanceBeforeSpend = nextEntry.balance + pointsUsed;
            await tx.historyEntry.create({
              data: {
                loyaltyAccountId: sendingAccountId,
                balance: inferredBalanceBeforeSpend,
                date: new Date(spendDate.getTime() - 1),
                reason: 'Automatic Balance Adjustment',
              },
            });
            balanceAtSpend = inferredBalanceBeforeSpend;
            subsequentUpdateNeeded = false;
          } else {
            // This case is unlikely for a retroactive spend, but as a fallback:
            balanceAtSpend = pointsUsed;
             await tx.historyEntry.create({
                data: {
                    loyaltyAccountId: sendingAccountId,
                    balance: pointsUsed,
                    date: new Date(spendDate.getTime() - 1),
                    reason: 'Automatic Balance Adjustment',
                }
            });
            subsequentUpdateNeeded = false;
          }
      }
    } else if (balanceAtSpend < pointsUsed) {
      // Non-retroactive spend with insufficient funds.
      throw new InsufficientBalanceError(
        `Insufficient balance. Current balance on ${spendDate.toLocaleDateString()} is ${balanceAtSpend.toLocaleString()}.`,
        'INSUFFICIENT_BALANCE_CURRENT'
      );
    }

    // 3. Create the spending transaction
    const spendingTransaction = await tx.spendingTransaction.create({
      data: {
        loyaltyAccountId: sendingAccountId,
        pointsUsed,
        type: 'SPEND',
        reason,
        partnerName,
        transferBonus,
        notes,
        date: spendDate,
      },
    });

    // 4. Create debit history entry
    await tx.historyEntry.create({
      data: {
        loyaltyAccountId: sendingAccountId,
        balance: balanceAtSpend - pointsUsed,
        date: spendDate,
        reason: `Spent: ${reason} - ${partnerName || ''}`,
        transactionId: spendingTransaction.id
      },
    });

    // 5. Update subsequent history
    if(subsequentUpdateNeeded) {
      await tx.historyEntry.updateMany({
        where: { loyaltyAccountId: sendingAccountId, date: { gt: spendDate } },
        data: { balance: { decrement: pointsUsed } },
      });
    }
    
    // 6. Handle partner transfer logic
    if (reason === 'Transfer to Partner' && partnerName) {
      const bonusPoints = Math.round(pointsUsed * (transferBonus / 100));
      const totalPointsToTransfer = pointsUsed + bonusPoints;

      let partnerAccount = await tx.loyaltyAccount.findFirst({
        where: { name: partnerName, userId: userId },
      });

      const partnerHistoryBefore = partnerAccount ? await tx.historyEntry.findFirst({
        where: { loyaltyAccountId: partnerAccount.id, date: { lte: spendDate } },
        orderBy: { date: 'desc' },
      }) : null;
      const partnerBalanceAtTransfer = partnerHistoryBefore ? partnerHistoryBefore.balance : 0;

      if (partnerAccount) {
         await tx.historyEntry.create({
          data: {
            loyaltyAccountId: partnerAccount.id,
            balance: partnerBalanceAtTransfer + totalPointsToTransfer,
            date: spendDate,
            reason: `Transfer from ${sendingAccount.name}`,
            transactionId: spendingTransaction.id
          }
        });
        await tx.historyEntry.updateMany({
          where: { loyaltyAccountId: partnerAccount.id, date: { gt: spendDate } },
          data: { balance: { increment: totalPointsToTransfer } },
        });
      } else {
        partnerAccount = await tx.loyaltyAccount.create({
          data: {
            name: partnerName,
            balance: totalPointsToTransfer,
            date: spendDate,
            userId: userId,
            category: 'AIRLINE',
            history: {
              create: {
                balance: totalPointsToTransfer,
                date: spendDate,
                reason: `Transfer from ${sendingAccount.name}`,
                transactionId: spendingTransaction.id
              }
            }
          }
        });
      }
    }

    // 7. Update main balances of all affected accounts
    const allAffectedAccountIds = [sendingAccountId];
    if (reason === 'Transfer to Partner' && partnerName) {
      const partner = await tx.loyaltyAccount.findFirst({ where: { name: partnerName, userId: userId }});
      if (partner) allAffectedAccountIds.push(partner.id);
    }

    for (const accountId of allAffectedAccountIds) {
        const latestEntry = await tx.historyEntry.findFirst({
            where: { loyaltyAccountId: accountId },
            orderBy: { date: 'desc' },
        });
        await tx.loyaltyAccount.update({
            where: { id: accountId },
            data: { 
                balance: latestEntry ? latestEntry.balance : 0,
                date: latestEntry ? latestEntry.date : new Date()
            },
        });
    }
    
    // 8. Return all the fully updated affected accounts
    return tx.loyaltyAccount.findMany({
      where: { id: { in: allAffectedAccountIds } },
      include: {
        history: { orderBy: { date: 'desc' } },
        spending: { orderBy: { date: 'desc' } },
      }
    });
}

export async function deleteSpendLogic(tx: any, spendId: string, userId: string): Promise<string[]> {
    const spendingTransaction = await tx.spendingTransaction.findUnique({
        where: { id: spendId },
        include: { account: true }
    });

    if (!spendingTransaction) {
        throw new Error('Spending transaction not found.');
    }
    if (spendingTransaction.account.userId !== userId) {
        throw new Error('Access denied to spending transaction.');
    }
    
    const affectedAccountIds: string[] = [spendingTransaction.loyaltyAccountId];
    
    // For transfers, handle the receiving account first
    if (spendingTransaction.reason === 'Transfer to Partner' && spendingTransaction.partnerName) {
        const partnerAccount = await tx.loyaltyAccount.findFirst({
            where: { name: spendingTransaction.partnerName, userId: userId }
        });

        if (partnerAccount) {
            affectedAccountIds.push(partnerAccount.id);
            // Delete corresponding history entries from the partner account
            await tx.historyEntry.deleteMany({
                where: {
                    loyaltyAccountId: partnerAccount.id,
                    transactionId: spendId,
                }
            });

            // Update partner account balance to the latest history entry
            const latestPartnerEntry = await tx.historyEntry.findFirst({
                where: { loyaltyAccountId: partnerAccount.id },
                orderBy: { date: 'desc' },
            });
            await tx.loyaltyAccount.update({
                where: { id: partnerAccount.id },
                data: {
                    balance: latestPartnerEntry ? latestPartnerEntry.balance : 0,
                    date: latestPartnerEntry ? latestPartnerEntry.date : new Date()
                }
            });
        }
    }

    // Delete the history entries associated with this spend from the source account
    await tx.historyEntry.deleteMany({
        where: { transactionId: spendId }
    });
   
    // Delete the spending transaction itself
    await tx.spendingTransaction.delete({ where: { id: spendId } });

    // The calling function will be responsible for updating the source account's final balance
    return affectedAccountIds;
} 