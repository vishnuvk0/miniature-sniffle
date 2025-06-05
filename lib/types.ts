export interface NewAccountData {
  accountName: string;
  balance: number;
  ownerName: string;
  date: string; // ISO string format e.g., "YYYY-MM-DD"
}

export interface Account extends NewAccountData {
  id: string; // Unique identifier for each account
  history: Array<{ date: string; balance: number }>; // To store balance changes over time
} 