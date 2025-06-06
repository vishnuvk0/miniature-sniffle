import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: loyaltyAccountId } = params;
    const body = await request.json();
    const { pointsUsed, method, partnerName, cpp } = body;

    // Validate input
    if (!pointsUsed || !method) {
        return new NextResponse('Missing required fields', { status: 400 });
    }
    
    const account = await prisma.loyaltyAccount.findFirst({
        where: { id: loyaltyAccountId, userId: session.user.id }
    });

    if (!account) {
        return new NextResponse('Account not found or access denied', { status: 404 });
    }

    const newBalance = account.balance - pointsUsed;
    const reason = `Spent: ${method}${partnerName ? ` (${partnerName})` : ''}`;

    // Use a prisma transaction to ensure both operations succeed or fail together
    const [, , updatedAccount] = await prisma.$transaction([
      // 1. Log the spending transaction
      prisma.spendingTransaction.create({
        data: {
          loyaltyAccountId,
          pointsUsed,
          method,
          partnerName,
          cpp: cpp ? parseFloat(cpp) : null,
        },
      }),

      // 2. Create a new history entry for the balance change
      prisma.historyEntry.create({
        data: {
          loyaltyAccountId,
          balance: newBalance,
          date: new Date(),
          reason,
        },
      }),

      // 3. Update the main account balance
      prisma.loyaltyAccount.update({
        where: { id: loyaltyAccountId },
        data: {
          balance: newBalance,
          date: new Date(),
        },
        include: {
          history: { orderBy: { date: 'desc' } },
          spending: { orderBy: { date: 'desc' } },
        }
      })
    ]);

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error logging spending:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 