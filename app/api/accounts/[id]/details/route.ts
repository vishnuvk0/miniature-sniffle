import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: accountId } = params;
  const { customName, accountIdNumber, notes } = await req.json();

  try {
    // Verify ownership
    const account = await prisma.loyaltyAccount.findFirst({
        where: { id: accountId, userId: session.user.id }
    });
    
    if (!account) {
        return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    const updatedAccount = await prisma.loyaltyAccount.update({
      where: { id: accountId },
      data: {
        customName,
        accountIdNumber,
        notes,
      },
      include: {
        history: { orderBy: { date: 'desc' } },
        spending: { orderBy: { date: 'desc' } },
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error: any) {
    console.error(`Error updating account details for ${accountId}:`, error);
    return NextResponse.json({ error: 'Failed to update account details' }, { status: 500 });
  }
} 