export interface FiendRow {
  id: string;
  name: string;
  balance: number;
  credit: number;
  bankruptcies: number;
  createdAt: string;
  updatedAt: string;
}

export interface BetRow {
  id: number;
  description: string;
  type: string;
  moneyLine: number | undefined;
  spread: number | null;
  isOpen: number;
  isSettled: number;
  secretDescription: string | null;
  result: string | null;
  date: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WagerRow {
  id: number;
  userId: string;
  betId: number;
  amount: number;
  choice: string;
  isSettled: number;
  result: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FiendWagerRow extends WagerRow {
  name: string; // Fiend's name from the join
}
