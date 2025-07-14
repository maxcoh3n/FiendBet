import {
  SpreadTypes,
  Fiend,
  Wager,
  BetTypes,
  Bet,
  FiendWager,
} from "../common/types";
import { FiendRow, WagerRow, BetRow, FiendWagerRow } from "./models";

// Helper functions for type conversion
export function serializeChoice(choice: boolean | SpreadTypes): string {
  return typeof choice === "boolean" ? choice.toString() : choice;
}

export function deserializeChoice(choice: string): boolean | SpreadTypes {
  if (choice === "true") return true;
  if (choice === "false") return false;
  return choice as SpreadTypes;
}

export function serializeResult(
  result: boolean | SpreadTypes | undefined,
): string | null {
  if (result === undefined) return null;
  return typeof result === "boolean" ? result.toString() : result;
}

function deserializeResult(
  result: string | null,
): boolean | SpreadTypes | undefined {
  if (result === null) return undefined;
  if (result === "true") return true;
  if (result === "false") return false;
  return result as SpreadTypes;
}

// Convert database row to Fiend object
export function dbRowToFiend(row: FiendRow): Fiend {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    credit: row.credit || 0,
    bankruptcies: row.bankruptcies || 0,
  };
}

// Convert database row to Bet object
export function dbRowToBet(row: BetRow): Bet {
  return {
    id: row.id,
    description: row.description,
    type: row.type as BetTypes,
    moneyLine: row.moneyLine || undefined,
    spread: row.spread || undefined,
    isOpen: Boolean(row.isOpen),
    isSettled: Boolean(row.isSettled),
    result: deserializeResult(row.result),
    date: row.date ? new Date(row.date) : undefined,
  };
}

// Convert database row to Wager object
export function dbRowToWager(row: WagerRow): Wager {
  return {
    id: row.id,
    userId: row.userId,
    betId: row.betId,
    amount: row.amount,
    isSettled: Boolean(row.isSettled),
    choice: deserializeChoice(row.choice),
    result: deserializeResult(row.result),
  };
}

// Convert database row to Wager object
export function dbRowToFiendWager(row: FiendWagerRow): FiendWager {
  return {
    id: row.id,
    userId: row.userId,
    betId: row.betId,
    amount: row.amount,
    isSettled: Boolean(row.isSettled),
    choice: deserializeChoice(row.choice),
    result: deserializeResult(row.result),
    name: row.name,
  };
}
