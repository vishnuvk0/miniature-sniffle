import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createSpendLogic, InsufficientBalanceError } from '@/lib/spend-logic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: sendingAccountId } = params;
  const body = await req.json();

  if (!body.pointsUsed || !body.reason || !body.date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      return createSpendLogic(tx, sendingAccountId, session.user.id, body);
    });
    return NextResponse.json(transactionResult, { status: 200 });
  } catch (error: any) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: error.message, errorCode: error.errorCode }, { status: 409 });
    }
    console.error('Error processing spending:', error);
    return NextResponse.json({ error: error.message || 'Failed to process spending' }, { status: 500 });
  }
} 