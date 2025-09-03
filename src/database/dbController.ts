import { STARTING_BALANCE } from "../common/constants";
import {
  Bet,
  BetTypes,
  Fiend,
  FiendWager,
  SpreadTypes,
  Wager,
} from "../common/types";
import { getPayout } from "../common/util";
import db from "./db";
import {
  dbRowToBet,
  dbRowToFiend,
  dbRowToFiendWager,
  dbRowToWager,
  deserializeChoice,
  serializeChoice,
  serializeResult,
} from "./dbHelpers";
import {
  closeAllBetsStmt,
  closeBetStmt,
  getAllFiendsStmt,
  getBetStmt,
  getFiendStmt,
  getFiendWagersByBetStmt,
  getUnsettledBetsStmt,
  getWagersByBetAllStmt,
  getWagersByBetStmt,
  insertAwardStmt,
  insertBetStmt,
  insertFiendStmt,
  insertWagerStmt,
  settleBetStmt,
  settleWagerStmt,
  updateFiendBalanceStmt,
  updateFiendCreditStmt,
  voidBetStmt,
} from "./dbStatements";
import { BetRow, FiendRow, FiendWagerRow, WagerRow } from "./models";

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

/*
 * Closes a bet to new wagers by setting its isOpen property to false.
 * This does not settle the bet; it just marks it as closed.
 */
export function closeAllBets(): void {
  closeAllBetsStmt.run();
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
        deserializeChoice(wager.choice),
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
  if (!bet) {
    throw new Error("Bet does not exist");
  }

  if (bet.isSettled) {
    throw new Error("Bet is already settled");
  }

  if (!bet.isOpen) {
    throw new Error("Bet is no longer open for wagering");
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

export function getFiendWagersByBet(betId: number): FiendWager[] {
  const rows = getFiendWagersByBetStmt.all(betId) as FiendWagerRow[];
  return rows.map(dbRowToFiendWager);
}

export function awardFiend(
  userId: string,
  amount: number,
  description: string,
): Fiend {
  const fiend = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiend) {
    throw new Error("User does not exist");
  }

  // Add the award to the user's balance
  updateFiendBalanceStmt.run(amount, userId);
  insertAwardStmt.run(userId, amount, description); // Assuming insertAwardStmt is defined to log the award

  // Optionally, you could log this award in a separate awards table
  // For now, we just update the balance
  return dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
}
