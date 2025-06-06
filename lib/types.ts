import { HistoryEntry, SpendingTransaction } from '@prisma/client';

export type { HistoryEntry, SpendingTransaction };

export type Account = {
  id: string;
  name: string;
  customName?: string | null;
  accountIdNumber?: string | null;
  notes?: string | null;
  balance: number;
  date: Date;
  category: string;
  userId: string;
  history: HistoryEntry[];
  spending: SpendingTransaction[];
  card?: string | null;
  cardOpenDate?: Date | null;
  annualFee?: number | null;
  signupBonus?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface NewAccountData {
  name: string;
  balance: number;
  date: string;
  category: string;
  card?: string;
  cardOpenDate?: string;
  annualFee?: number;
  signupBonus?: number;
  accountIdNumber?: string;
  notes?: string;
}