import { Account as PrismaAccount, HistoryEntry as PrismaHistoryEntry } from '@prisma/client';

export type HistoryEntry = PrismaHistoryEntry;

export type Account = PrismaAccount & {
  history: HistoryEntry[];
};

export interface NewAccountData {
  name: string;
  balance: number;
  date: string;
} 