import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { HistoryEntry, LoyaltyAccount, SpendingTransaction } from '@prisma/client';
import { createSpendLogic, deleteSpendLogic, InsufficientBalanceError } from '@/lib/spend-logic';

type AccountWithDetails = LoyaltyAccount & {
    history: HistoryEntry[];
    spending: SpendingTransaction[];
};

// This function recalculates all history entry balances after a specific date
async function recalculateHistoryFrom(tx: any, accountId: string, fromDate: Date, initialBalance: number) {
    const subsequentHistory = await tx.historyEntry.findMany({
        where: {
            loyaltyAccountId: accountId,
            date: { gte: fromDate },
        },
        orderBy: { date: 'asc' },
    });

    let currentBalance = initialBalance;
    for (const entry of subsequentHistory) {
        // This assumes we can determine the change from the reason or other fields,
        // which is not robust. The core issue is storing absolute balances.
        // A better fix is to re-calculate based on a stored delta, but that's a bigger migration.
        // For now, we will have to assume deletion logic handles the balance correction.
        // This function is more of a placeholder for a more complex reality.
        // The logic in the DELETE function will manually adjust balances.
    }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; spendId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: accountId, spendId } = params;

  try {
    const body = await req.json();
    
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Delete the old transaction logic. This reverts partner balances.
      const affectedIdsFromDelete = await deleteSpendLogic(tx, spendId, userId);

      // Update balances for all accounts affected by the deletion to get a clean state
      for (const id of affectedIdsFromDelete) {
          const latestEntry = await tx.historyEntry.findFirst({
              where: { loyaltyAccountId: id },
              orderBy: { date: 'desc' },
          });
          await tx.loyaltyAccount.update({
              where: { id },
              data: { 
                  balance: latestEntry ? latestEntry.balance : 0,
                  date: latestEntry ? latestEntry.date : new Date()
              },
          });
      }
      
      // 2. Create the new transaction with the updated data. This recalculates everything.
      const finalUpdatedAccounts = await createSpendLogic(tx, accountId, userId, body);
      return finalUpdatedAccounts;
    });

    return NextResponse.json(transactionResult);

  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
        return NextResponse.json({ error: error.message, errorCode: error.errorCode }, { status: 409 });
    }
    console.error(`Error updating spending transaction ${spendId}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update spending transaction' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; spendId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { spendId } = params;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
        const affectedAccountIds = await deleteSpendLogic(tx, spendId, session.user.id);
        
        // Update balances for all affected accounts after deletion
        for (const accountId of affectedAccountIds) {
            const latestSourceEntry = await tx.historyEntry.findFirst({
                where: { loyaltyAccountId: accountId },
                orderBy: { date: 'desc' },
            });

            await tx.loyaltyAccount.update({
                where: { id: accountId },
                data: {
                    balance: latestSourceEntry ? latestSourceEntry.balance : 0,
                    date: latestSourceEntry ? latestSourceEntry.date : new Date(),
                },
            });
        }
        
        // Return the fully updated state of all affected accounts
        return tx.loyaltyAccount.findMany({
            where: { id: { in: affectedAccountIds }},
            include: {
                history: { orderBy: { date: 'desc' } },
                spending: { orderBy: { date: 'desc' } },
            },
        });
    });

    return NextResponse.json(transactionResult);

  } catch (error: any) {
    console.error('Error deleting spending transaction:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete spending transaction' }, { status: 500 });
  }
} 