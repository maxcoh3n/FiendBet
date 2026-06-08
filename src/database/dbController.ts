import { STARTING_BALANCE } from "../common/constants";
import {
  Bet,
  BetTypes,
  Competition,
  CompetitionEntry,
  Fiend,
  FiendWager,
  SpreadTypes,
  Wager,
} from "../common/types";
import { getPayout } from "../common/util";
import db from "./db";
import {
  dbRowToBet,
  dbRowToCompetition,
  dbRowToCompetitionEntry,
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
  getAllCompetitionsStmt,
  getAllFiendsStmt,
  getBetStmt,
  getCompetitionEntriesByCompetitionStmt,
  getCompetitionEntryStmt,
  getCompetitionStmt,
  getFiendStmt,
  getFiendWagersByBetAndUserStmt,
  getFiendWagersByBetStmt,
  getUnsettledBetsByUserStmt,
  getUnsettledBetsStmt,
  getWagerByBetAndUserStmt,
  getWagerByIdStmt,
  getWagersByBetAllStmt,
  getWagersByBetStmt,
  insertAwardStmt,
  insertBetStmt,
  insertCompetitionEntryStmt,
  insertCompetitionStmt,
  insertFiendStmt,
  insertWagerStmt,
  settleBetStmt,
  settleWagerStmt,
  updateCompetitionEntryAwardStmt,
  updateCompetitionEntryReentryStmt,
  updateCompetitionEntryWinnerStmt,
  updateCompetitionIsOpenStmt,
  updateCompetitionIsSettledStmt,
  updateFiendBalanceStmt,
  updateFiendCreditStmt,
  updateWagerStmt,
  voidBetStmt,
} from "./dbStatements";
import {
  BetRow,
  CompetitionEntryRow,
  CompetitionRow,
  FiendRow,
  FiendWagerRow,
  WagerRow,
} from "./models";

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
  secretDescription: string | null,
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

  const result = insertBetStmt.run(
    description,
    secretDescription,
    type,
    moneyLine,
    spread,
    1,
    0,
  );
  return dbRowToBet(getBetStmt.get(result.lastInsertRowid) as BetRow);
}

export function getBet(id: number): Bet | null {
  const row = getBetStmt.get(id) as BetRow | undefined;
  return row ? dbRowToBet(row) : null;
}

export function getCompetition(id: number): Competition | null {
  const row = getCompetitionStmt.get(id) as CompetitionRow | undefined;
  return row ? dbRowToCompetition(row) : null;
}

export function getAllCompetitions(): Competition[] {
  const rows = getAllCompetitionsStmt.all() as CompetitionRow[];
  return rows.map(dbRowToCompetition);
}

export function getUnsettledCompetitions(): Competition[] {
  return getAllCompetitions().filter((competition) => !competition.isSettled);
}

export function getSettledCompetitions(): Competition[] {
  return getAllCompetitions().filter((competition) => competition.isSettled);
}

export function getUnsettledBets(): Bet[] {
  const rows = getUnsettledBetsStmt.all() as BetRow[];
  return rows.map(dbRowToBet);
}

export function getUnsettledBetsByUser(userId: string): Bet[] {
  const rows = getUnsettledBetsByUserStmt.all(userId) as BetRow[];
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
    const existingWager = getWagerByBetAndUserStmt.get(betId, userId) as
      | WagerRow
      | undefined;

    if (existingWager) {
      const creditDiff = amount - existingWager.amount;
      updateWagerStmt.run(amount, serializeChoice(choice), existingWager.id);
      updateFiendCreditStmt.run(creditDiff, userId);

      existingWager.amount = amount;
      existingWager.choice = serializeChoice(choice);
      wager = dbRowToWager(existingWager);
      updatedFiend = dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
      return;
    }

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
    const wagerRow = getWagerByIdStmt.get(
      wagerResult.lastInsertRowid,
    ) as WagerRow;
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

export function getFiendWagersByBetAndUser(
  betId: number,
  userId: string,
): FiendWager[] {
  const rows = getFiendWagersByBetAndUserStmt.all(
    betId,
    userId,
  ) as FiendWagerRow[];
  return rows.map(dbRowToFiendWager);
}

export function createCompetition(
  description: string,
  entryFee: number,
  award: number | null = null,
): Competition {
  const result = insertCompetitionStmt.run(description, entryFee, award);
  const row = db
    .prepare("SELECT * FROM competitions WHERE id = ?")
    .get(result.lastInsertRowid) as any;
  return dbRowToCompetition(row);
}

export function getCompetitionEntriesByCompetition(
  competitionId: number,
): CompetitionEntry[] {
  const rows = getCompetitionEntriesByCompetitionStmt.all(
    competitionId,
  ) as CompetitionEntryRow[];
  return rows.map(dbRowToCompetitionEntry);
}

export function settleCompetition(
  competitionId: number,
  awards: Array<{ userId: string; amount: number }>,
): [Fiend, number][] {
  const competition = getCompetitionStmt.get(competitionId) as
    | CompetitionRow
    | undefined;
  if (!competition) {
    throw new Error("Competition does not exist");
  }

  if (competition.isSettled) {
    throw new Error("Competition is already settled");
  }

  const entries = getCompetitionEntriesByCompetitionStmt.all(
    competitionId,
  ) as CompetitionEntryRow[];

  if (!entries.length) {
    throw new Error("Competition has no entries");
  }

  const enteredUserIds = new Set(entries.map((entry) => entry.userId));

  if (awards.length !== enteredUserIds.size) {
    throw new Error("Must provide a payout for each competition entrant.");
  }

  const seenUserIds = new Set<string>();
  for (const awardItem of awards) {
    if (seenUserIds.has(awardItem.userId)) {
      throw new Error("Duplicate user payout found.");
    }
    if (!enteredUserIds.has(awardItem.userId)) {
      throw new Error(
        `User ${awardItem.userId} did not enter competition ${competitionId}`,
      );
    }
    seenUserIds.add(awardItem.userId);
  }

  const results: [Fiend, number][] = [];
  const entryFeeByUser = new Map<string, number>();
  for (const entry of entries) {
    entryFeeByUser.set(entry.userId, entry.entry_fee);
  }

  const transaction = db.transaction(() => {
    updateCompetitionIsSettledStmt.run(1, competitionId);
    updateCompetitionIsOpenStmt.run(0, competitionId);

    for (const awardItem of awards) {
      const entryFee = entryFeeByUser.get(awardItem.userId) ?? 0;
      updateCompetitionEntryAwardStmt.run(
        awardItem.amount,
        awardItem.amount,
        competitionId,
        awardItem.userId,
      );

      updateFiendBalanceStmt.run(awardItem.amount, awardItem.userId);

      if (awardItem.amount !== 0) {
        insertAwardStmt.run(
          awardItem.userId,
          awardItem.amount,
          `Competition ${competitionId} payout`,
        );
      }

      const updatedFiend = dbRowToFiend(
        getFiendStmt.get(awardItem.userId) as FiendRow,
      );
      results.push([updatedFiend, awardItem.amount - entryFee]);
    }
  });

  transaction();

  return results;
}

export function createCompetitionEntry(
  userId: string,
  competitionId: number,
): any {
  // Prevent duplicate entries
  const existing = getCompetitionEntryStmt.get(competitionId, userId) as
    | CompetitionEntryRow
    | undefined;
  if (existing) {
    return dbRowToCompetitionEntry(existing);
  }

  // Look up competition and fee
  const competitionRow = getCompetitionStmt.get(competitionId) as
    | any
    | undefined;
  if (!competitionRow) {
    throw new Error("Competition does not exist");
  }

  const entryFee = competitionRow.entryFee as number;

  // Check that competition is open
  if (competitionRow.isOpen === 0 || competitionRow.isOpen === false) {
    throw new Error("Competition closed");
  }

  // Ensure user exists
  const fiendRow = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiendRow) {
    throw new Error("User does not exist");
  }

  if (fiendRow.balance < entryFee) {
    throw new Error("Insufficient funds");
  }

  // Deduct fee from user's balance and insert entry atomically
  const transaction = db.transaction(() => {
    updateFiendBalanceStmt.run(-entryFee, userId);
    insertCompetitionEntryStmt.run(userId, competitionId, 0, 0, 0, entryFee, 1);
  });

  transaction();

  const row = db
    .prepare("SELECT * FROM competition_entries WHERE id = last_insert_rowid()")
    .get() as CompetitionEntryRow;
  return dbRowToCompetitionEntry(row);
}

export function createCompetitionEntryWithCustomFee(
  userId: string,
  competitionId: number,
  fee: number,
): any {
  const existing = getCompetitionEntryStmt.get(competitionId, userId) as
    | CompetitionEntryRow
    | undefined;
  if (existing) {
    return dbRowToCompetitionEntry(existing);
  }

  const competitionRow = getCompetitionStmt.get(competitionId) as
    | any
    | undefined;
  if (!competitionRow) {
    throw new Error("Competition does not exist");
  }

  // Check that competition is open
  if (competitionRow.isOpen === 0 || competitionRow.isOpen === false) {
    throw new Error("Competition closed");
  }

  if (fee <= 0) {
    throw new Error("Reentry fee must be greater than zero");
  }

  const fiendRow = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiendRow) {
    throw new Error("User does not exist");
  }

  if (fiendRow.balance < fee) {
    throw new Error("Insufficient funds");
  }

  const transaction = db.transaction(() => {
    updateFiendBalanceStmt.run(-fee, userId);
    insertCompetitionEntryStmt.run(userId, competitionId, 0, 0, 0, fee, 1);
  });

  transaction();

  const row = db
    .prepare("SELECT * FROM competition_entries WHERE id = last_insert_rowid()")
    .get() as CompetitionEntryRow;
  return dbRowToCompetitionEntry(row);
}

export function reenterCompetitionEntry(
  userId: string,
  competitionId: number,
  fee: number,
): any {
  if (fee <= 0) {
    throw new Error("Reentry fee must be greater than zero");
  }

  const existingEntry = getCompetitionEntryStmt.get(competitionId, userId) as
    | CompetitionEntryRow
    | undefined;
  if (!existingEntry) {
    throw new Error("Competition entry does not exist");
  }

  const fiendRow = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiendRow) {
    throw new Error("User does not exist");
  }

  if (fiendRow.balance < fee) {
    throw new Error("Insufficient funds");
  }

  const transaction = db.transaction(() => {
    updateFiendBalanceStmt.run(-fee, userId);
    updateCompetitionEntryReentryStmt.run(fee, competitionId, userId);
  });

  transaction();

  const row = getCompetitionEntryStmt.get(
    competitionId,
    userId,
  ) as CompetitionEntryRow;
  return dbRowToCompetitionEntry(row);
}

export function deductFiendBalance(userId: string, amount: number): Fiend {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const fiendRow = getFiendStmt.get(userId) as FiendRow | undefined;
  if (!fiendRow) {
    throw new Error("User does not exist");
  }

  if (fiendRow.balance < amount) {
    throw new Error("Insufficient funds");
  }

  updateFiendBalanceStmt.run(-amount, userId);
  return dbRowToFiend(getFiendStmt.get(userId) as FiendRow);
}

export function closeCompetition(competitionId: number): void {
  updateCompetitionIsOpenStmt.run(0, competitionId);
}

export function awardCompetitionWinner(
  competitionId: number,
  userId: string,
): { balance: number } {
  const competition = getCompetitionStmt.get(competitionId) as any | undefined;
  if (!competition) throw new Error("Competition does not exist");

  // Transaction: mark winner, close competition, award fiend
  const transaction = db.transaction(() => {
    updateCompetitionEntryWinnerStmt.run(competitionId, userId);
    updateCompetitionIsOpenStmt.run(0, competitionId);

    if (competition.award !== null && competition.award !== undefined) {
      updateFiendBalanceStmt.run(competition.award, userId);
      insertAwardStmt.run(
        userId,
        competition.award,
        `Competition ${competitionId} award`,
      );
    }
  });

  transaction();

  const fiendRow = getFiendStmt.get(userId) as FiendRow;
  return { balance: fiendRow.balance };
}

export function hasCompetitionEntry(
  userId: string,
  competitionId: number,
): boolean {
  const existing = getCompetitionEntryStmt.get(competitionId, userId) as
    | CompetitionEntryRow
    | undefined;
  return !!existing;
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
