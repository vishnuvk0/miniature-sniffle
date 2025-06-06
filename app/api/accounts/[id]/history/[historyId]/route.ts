import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, historyId } = params;
  try {
    // Verify the user owns the account associated with the history entry
    const account = await prisma.loyaltyAccount.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    // First, delete the specific history entry
    await prisma.historyEntry.delete({
      where: { id: historyId },
    });

    // Then, find the latest remaining history entry for the account
    const latestHistoryEntry = await prisma.historyEntry.findFirst({
      where: { loyaltyAccountId: id },
      orderBy: { date: 'desc' },
    });

    // Update the account's main balance and date to reflect the latest entry
    // If no history entries are left, you might want to set a default state or handle as needed
    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id },
      data: {
        balance: latestHistoryEntry ? latestHistoryEntry.balance : 0, // Default to 0 if no history
        date: latestHistoryEntry ? latestHistoryEntry.date : new Date(), // Default to now if no history
      },
      include: {
        history: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error(`Error deleting history entry ${historyId} for account ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete history entry' }, { status: 500 });
  }
} 