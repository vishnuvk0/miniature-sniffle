import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { addDays, differenceInDays } from 'date-fns';
import type { Prisma } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accounts = await prisma.loyaltyAccount.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        history: {
          orderBy: {
            date: 'desc',
          },
        },
        spending: {
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
    } as any);
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  console.log("SESSION IN POST /api/accounts:", JSON.stringify(session, null, 2));

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, balance, date, category, card, cardOpenDate, annualFee, signupBonus, accountIdNumber, notes } = await req.json();

    if (!name || typeof balance !== 'number' || !date || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currentDate = new Date(date);
    let historyData = [{ balance, date: currentDate }];

    // Special logic for credit card with SUB
    if (category === 'CREDIT_CARD' && signupBonus && signupBonus > 0 && cardOpenDate) {
      const openDate = new Date(cardOpenDate);
      const subDurationDays = 90; // Default SUB duration
      let subPostDate: Date;

      const daysSinceOpened = differenceInDays(new Date(), openDate);

      if (daysSinceOpened > subDurationDays) {
        // If SUB period has passed, post SUB at end of period
        subPostDate = addDays(openDate, subDurationDays);
      } else {
        // Otherwise, assume it was just earned, post it yesterday
        subPostDate = addDays(new Date(), -1);
      }

      // Ensure SUB date is before the current balance date for a logical history
      if (subPostDate >= currentDate) {
        subPostDate = addDays(currentDate, -1);
      }
      
      historyData = [
        { balance: signupBonus, date: subPostDate },
        { balance: balance, date: currentDate }
      ];
    }

    const createData: Prisma.LoyaltyAccountCreateInput = {
      name,
      balance,
      date: currentDate,
      userId: session.user.id,
      category,
      card,
      cardOpenDate: cardOpenDate ? new Date(cardOpenDate) : undefined,
      annualFee,
      signupBonus,
      accountIdNumber,
      notes,
      history: {
        create: historyData,
      },
    } as any;

    const newAccount = await prisma.loyaltyAccount.create({
      data: createData,
      include: {
        history: true,
      },
    } as any);

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
} 