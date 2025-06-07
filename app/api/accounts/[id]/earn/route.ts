import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createEarnLogic } from '@/lib/earn-logic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: accountId } = params;
  const body = await req.json();

  if (!body.pointsEarned || !body.reason || !body.date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const updatedAccount = await prisma.$transaction(async (tx) => {
      return createEarnLogic(tx, accountId, session.user.id, body);
    });
    return NextResponse.json(updatedAccount, { status: 200 });
  } catch (error: any) {
    console.error('Error processing earning:', error);
    return NextResponse.json({ error: error.message || 'Failed to process earning' }, { status: 500 });
  }
} 