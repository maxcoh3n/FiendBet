export enum BetTypes {
  MONEYLINE,
  SPREAD,
}

export enum SpreadTypes {
  OVER = "Over",
  UNDER = "Under",
}

export interface Fiend {
  id: string;
  name: string;
  balance: number; // User's balance in FiendBucks
  credit?: number; // Credit extended to user in open wagers
  bankrupcies?: number;
}

export interface Bet {
  id: number;
  description: string;
  type: BetTypes;
  moneyLine?: number; // For moneyline bets
  spread?: number; // For spread bets
  isOpen: boolean;
  isSettled: boolean;
  result?: boolean | SpreadTypes; // Result can be true/false for moneyline or a number for spread
}

export interface Wager {
  id: number;
  userId: string;
  betId: number;
  amount: number;
  isSettled: boolean;
  choice: boolean | SpreadTypes; // Choice can be true/false for moneyline or OVER/UNDER for spread
  result?: boolean | SpreadTypes; // Result can be true/false for moneyline or a OVER/UNDER for spread
}
