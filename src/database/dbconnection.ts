import { BetTypes, SpreadTypes, Fiend, Bet, Wager } from ".././common/types";
import { getPayout } from ".././common/util";
import { STARTING_BALANCE } from ".././common/constants";
import db from "./db";

// Database row types
interface FiendRow {
  id: string;
  name: string;
  balance: number;
  credit: number;
  bankruptcies: number;
  createdAt: string;
  updatedAt: string;
}

interface BetRow {
  id: number;
  description: string;
  type: string;
  moneyLine: number | undefined;
  spread: number | null;
  isOpen: number;
  isSettled: number;
  result: string | null;
  date: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WagerRow {
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

// Prepared statements for fiends
const getFiendStmt = db.prepare("SELECT * FROM fiends WHERE id = ?");
const getAllFiendsStmt = db.prepare("SELECT * FROM fiends");
const insertFiendStmt = db.prepare(
  "INSERT INTO fiends (id, name, balance, credit, bankruptcies) VALUES (?, ?, ?, ?, ?)",
);
const updateFiendBalanceStmt = db.prepare(
  "UPDATE fiends SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
const updateFiendCreditStmt = db.prepare(
  "UPDATE fiends SET credit = credit + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

// Prepared statements for bets
const getBetStmt = db.prepare("SELECT * FROM bets WHERE id = ?");
const getUnsettledBetsStmt = db.prepare(
  "SELECT * FROM bets WHERE isSettled = 0",
);
const insertBetStmt = db.prepare(
  "INSERT INTO bets (description, type, moneyLine, spread, isOpen, isSettled) VALUES (?, ?, ?, ?, ?, ?)",
);
const closeBetStmt = db.prepare(
  "UPDATE bets SET isOpen = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
const settleBetStmt = db.prepare(
  "UPDATE bets SET isSettled = 1, result = ?, isOpen = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
const voidBetStmt = db.prepare(
  "UPDATE bets SET isOpen = 0, isSettled = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

// Prepared statements for wagers
const insertWagerStmt = db.prepare(
  "INSERT INTO wagers (userId, betId, amount, choice, isSettled) VALUES (?, ?, ?, ?, ?)",
);
const getWagersByBetStmt = db.prepare(
  "SELECT * FROM wagers WHERE betId = ? AND isSettled = 0",
);
const settleWagerStmt = db.prepare(
  "UPDATE wagers SET isSettled = 1, result = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
const getWagersByBetAllStmt = db.prepare(
  "SELECT * FROM wagers WHERE betId = ?",
);

// Helper functions for type conversion
function serializeChoice(choice: boolean | SpreadTypes): string {
  return typeof choice === "boolean" ? choice.toString() : choice;
}

function deserializeChoice(choice: string): boolean | SpreadTypes {
  if (choice === "true") return true;
  if (choice === "false") return false;
  return choice as SpreadTypes;
}

function serializeResult(
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
function dbRowToFiend(row: FiendRow): Fiend {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    credit: row.credit || 0,
    bankruptcies: row.bankruptcies || 0,
  };
}

// Convert database row to Bet object
function dbRowToBet(row: BetRow): Bet {
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
function dbRowToWager(row: WagerRow): Wager {
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

export function addFiendBucks(userId: string, amount: number): Fiend {
  const existingFiend = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!existingFiend) {
    throw new Error("User does not exist");
  }

  updateFiendBalanceStmt.run(amount, userId);
  return dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
}

export function addFiendCredit(userId: string, amount: number): Fiend {
  const existingFiend = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!existingFiend) {
    throw new Error("User does not exist");
  }

  updateFiendCreditStmt.run(amount, userId);
  return dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
}

export function getFiend(userId: string): Fiend | undefined {
  const row = getFiendStmt.get(userId) as FiendRow | undefined;
  return row ? dbRowToFiend(row) : undefined;
}

export function getAllFiends(): Fiend[] {
  const rows = getAllFiendsStmt.all() as FiendRow[];
  return rows.map(dbRowToFiend);
}

export function createFiend(userId: string, name: string): Fiend {
  const existingFiend = getFiendStmt.get(userId) as FiendRow | undefined;
  if (existingFiend) {
    throw new Error("Fiend already exists");
  }

  insertFiendStmt.run(userId, name, STARTING_BALANCE, 0, 0);
  return dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
}

export function createBet(
  description: string,
  type: BetTypes,
  moneyLine: number | undefined = undefined,
  spread: number | undefined = undefined,
): Bet {
  if (type === BetTypes.MONEYLINE && !moneyLine) {
    throw new Error("Moneyline value must be provided for moneyline bets");
  }

  if (type === BetTypes.SPREAD && !spread) {
    throw new Error("Spread value must be provided for spread bets");
  }

  const result = insertBetStmt.run(description, type, moneyLine, spread, 1, 0);
  return dbRowToBet(getBetStmt.get(result.lastInsertRowid) as BetRow);
}

export function getBet(id: number): Bet | null {
  const row = getBetStmt.get(id) as BetRow | undefined;
  return row ? dbRowToBet(row) : null;
}

export function getUnsettledBets(): Bet[] {
  const rows = getUnsettledBetsStmt.all() as BetRow[];
  return rows.map(dbRowToBet);
}

/*
 * Closes a bet to new wagers by setting its isOpen property to false.
 * This does not settle the bet; it just marks it as closed.
 */
export function closeBet(id: number): void {
  closeBetStmt.run(id);
}

export function voidBet(id: number): void {
  const bet = getBetStmt.get(id) as BetRow | undefined;
  if (!bet) {
    throw new Error("Bet does not exist");
  }

  if (bet.isSettled) {
    throw new Error("Bet is already settled");
  }

  // Use transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // Mark bet as voided (closed and settled)
    voidBetStmt.run(id);

    // Get all wagers for this bet
    const wagers = getWagersByBetAllStmt.all(id) as WagerRow[];

    // For each wager, subtract the amount from the fiend's credit and mark as settled
    for (const wager of wagers) {
      if (!wager.isSettled) {
        // Subtract wager amount from fiend's credit (return their credit)
        updateFiendCreditStmt.run(-wager.amount, wager.userId);

        // Mark wager as settled with no result (voided)
        settleWagerStmt.run(null, wager.id);
      }
    }
  });

  transaction();
}

/*
 * Settles a bet by setting its isSettled property to true and assigning a result.
 * Also pays out results to users who wagered on the bet.
 * The result can be any value that indicates the outcome of the bet.
 */
export function settleBet(
  id: number,
  result: boolean | SpreadTypes,
): [Fiend, number][] {
  const bet = getBetStmt.get(id) as BetRow | undefined;
  if (!bet) {
    throw new Error("Bet does not exist");
  }

  if (bet.isSettled) {
    throw new Error("Bet is already settled");
  }

  const results: [Fiend, number][] = [];

  // Use transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // Mark bet as settled
    settleBetStmt.run(serializeResult(result), id);

    // Get all unsettled wagers for this bet
    const wagers = getWagersByBetStmt.all(id) as WagerRow[];

    for (const wager of wagers) {
      // Mark wager as settled
      settleWagerStmt.run(serializeResult(result), wager.id);

      const isBetWon = deserializeChoice(wager.choice) === result;
      const payout = getPayout(
        wager.amount,
        isBetWon,
        bet.type as BetTypes,
        bet.moneyLine,
      );

      // Add payout to fiend's balance
      updateFiendBalanceStmt.run(payout, wager.userId);

      // Subtract wager amount from fiend's credit (they no longer owe this)
      updateFiendCreditStmt.run(-wager.amount, wager.userId);

      // Get updated fiend data
      const updatedFiend = dbRowToFiend(
        getFiendStmt.get(wager.userId) as FiendRow,
      );
      results.push([updatedFiend, payout]);
    }
  });

  transaction();
  return results;
}

/* creates a wager for a bet and adds that amount to the fiend's credit balance
 */
export function createWager(
  userId: string,
  betId: number,
  amount: number,
  choice: boolean | SpreadTypes,
): [Wager, Fiend] {
  const fiend = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiend) {
    throw new Error("User does not exist");
  }

  const bet = getBetStmt.get(betId) as BetRow | undefined;
  if (!bet || !bet.isOpen) {
    throw new Error("Bet does not exist or is not open");
  }

  if (bet.isSettled) {
    throw new Error("Bet is already settled");
  }

  if (!bet.isOpen) {
    throw new Error("Bet is not open for wagering");
  }

  if (
    bet.type === BetTypes.MONEYLINE.toString() &&
    !(choice === true || choice === false)
  ) {
    throw new Error("Boolean choice must be provided for moneyline bets");
  }

  if (
    bet.type === BetTypes.SPREAD.toString() &&
    !(choice === SpreadTypes.OVER || choice === SpreadTypes.UNDER)
  ) {
    throw new Error("Over/Under choice must be provided for spread bets");
  }

  let wager: Wager;
  let updatedFiend: Fiend;

  // Use transaction to ensure atomicity
  const transaction = db.transaction(() => {
    // Create the wager
    const wagerResult = insertWagerStmt.run(
      userId,
      betId,
      amount,
      serializeChoice(choice),
      0,
    );

    // Add amount to fiend's credit
    updateFiendCreditStmt.run(amount, userId);

    // Get the created wager and updated fiend
    const wagerRow = db
      .prepare("SELECT * FROM wagers WHERE id = ?")
      .get(wagerResult.lastInsertRowid) as WagerRow;
    const fiendRow = getFiendStmt.get(userId) as FiendRow;

    wager = dbRowToWager(wagerRow);
    updatedFiend = dbRowToFiend(fiendRow);
  });

  transaction();
  return [wager!, updatedFiend!];
}
