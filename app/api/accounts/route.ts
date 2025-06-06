import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
        // spending: {
        //   orderBy: {
        //     date: 'desc'
        //   }
        // }
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
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
    const { name, balance, date, category, card, cardOpenDate, annualFee, signupBonus } = await req.json();

    if (!name || typeof balance !== 'number' || !date || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newAccount = await prisma.loyaltyAccount.create({
      data: {
        name,
        balance,
        date: new Date(date),
        userId: session.user.id,
        category,
        card,
        cardOpenDate: cardOpenDate ? new Date(cardOpenDate) : undefined,
        annualFee,
        signupBonus,
        history: {
          create: {
            balance,
            date: new Date(date),
          },
        },
      },
      include: {
        history: true,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
} 