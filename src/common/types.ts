export enum BetTypes {
  MONEYLINE = "Moneyline",
  SPREAD = "Spread",
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
  bankruptcies?: number;
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
  date?: Date; // Date when the bet will likely be resolved so we can ping as a reminder
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

export interface FiendWager extends Wager {
  name: string; // Fiend's name from the join
}

export interface Award {
  id: number;
  userId: string; //id for winner of the award
  amount: number;
  description: string; // Reason for the award
}
