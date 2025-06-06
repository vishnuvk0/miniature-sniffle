import { LoyaltyAccount, HistoryEntry } from '@prisma/client';

export type { HistoryEntry };

// This is the type for our application's loyalty account, which includes its history
export type Account = LoyaltyAccount & {
  history: HistoryEntry[];
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
}