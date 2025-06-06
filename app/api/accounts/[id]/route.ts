import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    const { balance, date, reason } = await request.json();

    const accountOwner = await prisma.loyaltyAccount.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!accountOwner) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const updateDate = new Date(date);
    const startDate = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const existingEntry = await prisma.historyEntry.findFirst({
      where: {
        loyaltyAccountId: id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    if (existingEntry) {
      await prisma.historyEntry.update({
        where: { id: existingEntry.id },
        data: {
          balance,
          reason,
          date: updateDate,
        },
      });
    } else {
      await prisma.historyEntry.create({
        data: {
          loyaltyAccountId: id,
          balance,
          date: updateDate,
          reason,
        },
      });
    }

    const latestHistoryEntry = await prisma.historyEntry.findFirst({
      where: { loyaltyAccountId: id },
      orderBy: { date: 'desc' },
    });

    if (latestHistoryEntry) {
      await prisma.loyaltyAccount.update({
        where: { id },
        data: {
          balance: latestHistoryEntry.balance,
          date: latestHistoryEntry.date,
        },
      });
    }

    const updatedAccount = await prisma.loyaltyAccount.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Error updating account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;

    const account = await prisma.loyaltyAccount.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!account) {
      return new NextResponse('Not Found', { status: 404 });
    }

    await prisma.loyaltyAccount.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 