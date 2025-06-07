import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: accountId, historyId } = params;
  const { balance: newBalance, date: newDateStr } = await req.json();
  const newDate = new Date(newDateStr);

  if (typeof newBalance !== 'number' || !newDateStr) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const updatedAccount = await prisma.$transaction(async (tx) => {
      // 1. Get the original entry to calculate the delta
      const originalEntry = await tx.historyEntry.findUnique({
        where: { id: historyId },
      });

      if (!originalEntry) {
        throw new Error('History entry not found.');
      }

      // 2. Verify ownership
      const account = await tx.loyaltyAccount.findUnique({
        where: { id: originalEntry.loyaltyAccountId },
      });
      if (!account || account.userId !== session.user.id) {
        throw new Error('Account not found or access denied.');
      }
      
      // If the date has changed, the point of reference changes.
      // This logic gets very complex. For now, we assume the date change is minor
      // and doesn't cross other transaction dates. A robust solution would need
      // to "un-apply" the old transaction and "re-apply" the new one.
      
      // 3. Calculate the change (delta)
      const delta = newBalance - originalEntry.balance;

      // 4. Update the target history entry
      await tx.historyEntry.update({
        where: { id: historyId },
        data: {
          balance: newBalance,
          date: newDate,
        },
      });

      // 5. Update all subsequent history entries
      await tx.historyEntry.updateMany({
        where: {
          loyaltyAccountId: accountId,
          date: { gt: originalEntry.date }, // Apply to entries after the original date
          id: { not: historyId }
        },
        data: {
          balance: { increment: delta },
        },
      });
      
      // If date was moved earlier, we might need to adjust entries between new and old date
      if (newDate < originalEntry.date) {
         await tx.historyEntry.updateMany({
            where: {
                loyaltyAccountId: accountId,
                date: { gte: newDate, lt: originalEntry.date },
                id: { not: historyId }
            },
            data: {
                balance: { increment: delta }
            }
         });
      }
      // If date was moved later, reverse the change for entries between old and new
      if (newDate > originalEntry.date) {
        await tx.historyEntry.updateMany({
            where: {
                loyaltyAccountId: accountId,
                date: { gt: originalEntry.date, lte: newDate },
            },
            data: {
                balance: { decrement: delta } // Reverse the change
            }
        });
      }


      // 6. Update the main account balance to the latest history entry
      const latestHistoryEntry = await tx.historyEntry.findFirst({
        where: { loyaltyAccountId: accountId },
        orderBy: { date: 'desc' },
      });

      const finalUpdatedAccount = await tx.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          balance: latestHistoryEntry ? latestHistoryEntry.balance : 0,
          date: latestHistoryEntry ? latestHistoryEntry.date : new Date(),
        },
        include: {
          history: { orderBy: { date: 'desc' } },
          spending: { orderBy: { date: 'desc' } },
        },
      });
      
      return finalUpdatedAccount;
    });

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error(`Error updating history entry ${historyId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update history entry' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: accountId, historyId } = params;
  try {
    const updatedData = await prisma.$transaction(async (tx) => {
      // 1. Find the history entry to be deleted
      const historyEntryToDelete = await tx.historyEntry.findUnique({
        where: { id: historyId },
        include: { account: true }
      });

      if (!historyEntryToDelete) {
        throw new Error("History entry not found");
      }
      if (historyEntryToDelete.account.userId !== session.user.id) {
        throw new Error("Access denied");
      }

      const { transactionId } = historyEntryToDelete;
      let affectedAccountIds: string[] = [historyEntryToDelete.loyaltyAccountId];

      // 2. If it's linked to a spend, delete the spend and any partner link
      if (transactionId) {
        const deletedSpendIds = await deleteSpendLogic(tx, transactionId, session.user.id);
        affectedAccountIds = [...new Set([...affectedAccountIds, ...deletedSpendIds])];
      } else {
        // 3. If not linked to a spend, handle manual deletion logic (if any)
        // This part would contain logic for recalculating balances if a manual entry is deleted.
        // For now, we assume simple deletion is okay, but this is where complex recalculations would go.
        await tx.historyEntry.delete({ where: { id: historyId } });
      }

      // 4. Update the balances for all affected accounts
      for (const id of affectedAccountIds) {
        const latestHistoryEntry = await tx.historyEntry.findFirst({
          where: { loyaltyAccountId: id },
          orderBy: { date: 'desc' },
        });

        await tx.loyaltyAccount.update({
          where: { id },
          data: {
            balance: latestHistoryEntry ? latestHistoryEntry.balance : 0,
            date: latestHistoryEntry ? latestHistoryEntry.date : new Date(),
          },
        });
      }

      // 5. Return updated data for all affected accounts
      if (affectedAccountIds.length > 1) {
        return tx.loyaltyAccount.findMany({
          where: { id: { in: affectedAccountIds } },
          include: {
            history: { orderBy: { date: 'desc' } },
            spending: { orderBy: { date: 'desc' } },
          },
        });
      } else {
        return tx.loyaltyAccount.findUnique({
          where: { id: accountId },
          include: {
            history: { orderBy: { date: 'desc' } },
            spending: { orderBy: { date: 'desc' } },
          },
        });
      }
    });

    return NextResponse.json(updatedData);

  } catch (error) {
    console.error(`Error deleting history entry ${historyId} for account ${accountId}:`, error);
    return NextResponse.json({ error: 'Failed to delete history entry' }, { status: 500 });
  }
} 