import db from "./db";

// Prepared statements for fiends table
export const getFiendStmt = db.prepare("SELECT * FROM fiends WHERE id = ?");
export const getAllFiendsStmt = db.prepare("SELECT * FROM fiends");
export const insertFiendStmt = db.prepare(
  "INSERT INTO fiends (id, name, balance, credit, bankruptcies) VALUES (?, ?, ?, ?, ?)",
);
export const updateFiendBalanceStmt = db.prepare(
  "UPDATE fiends SET balance = balance + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
export const updateFiendCreditStmt = db.prepare(
  "UPDATE fiends SET credit = credit + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

// prepared statements for bets
export const getBetStmt = db.prepare("SELECT * FROM bets WHERE id = ?");
export const getUnsettledBetsStmt = db.prepare(
  "SELECT * FROM bets WHERE isSettled = 0",
);
export const insertBetStmt = db.prepare(
  "INSERT INTO bets (description, secretDescription, type, moneyLine, spread, isOpen, isSettled) VALUES (?, ?, ?, ?, ?, ?, ?)",
);
export const closeBetStmt = db.prepare(
  "UPDATE bets SET isOpen = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
export const closeAllBetsStmt = db.prepare("UPDATE bets SET isOpen = 0");

export const settleBetStmt = db.prepare(
  "UPDATE bets SET isSettled = 1, result = ?, isOpen = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
export const voidBetStmt = db.prepare(
  "UPDATE bets SET isOpen = 0, isSettled = 1, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

// Prepared statements for wagers
export const insertWagerStmt = db.prepare(
  "INSERT INTO wagers (userId, betId, amount, choice, isSettled) VALUES (?, ?, ?, ?, ?)",
);
export const getWagerByIdStmt = db.prepare("SELECT * FROM wagers WHERE id = ?");
export const getWagerByBetAndUserStmt = db.prepare(
  "SELECT * FROM wagers WHERE betId = ? AND userId = ? AND isSettled = 0",
);
export const updateWagerStmt = db.prepare(
  "UPDATE wagers SET amount = ?, choice = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
export const getWagersByBetStmt = db.prepare(
  "SELECT * FROM wagers WHERE betId = ? AND isSettled = 0",
);
export const settleWagerStmt = db.prepare(
  "UPDATE wagers SET isSettled = 1, result = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
export const getWagersByBetAllStmt = db.prepare(
  "SELECT * FROM wagers w WHERE betId = ?",
);

export const getFiendWagersByBetStmt = db.prepare(
  "SELECT f.name, w.* FROM wagers w JOIN fiends f ON w.userId = f.id WHERE w.betId = ? AND w.isSettled = 0",
);

export const getUnsettledBetsByUserStmt = db.prepare(
  "SELECT DISTINCT b.* FROM bets b JOIN wagers w ON b.id = w.betId WHERE w.userId = ? AND w.isSettled = 0 AND b.isSettled = 0",
);

export const getFiendWagersByBetAndUserStmt = db.prepare(
  "SELECT f.name, w.* FROM wagers w JOIN fiends f ON w.userId = f.id WHERE w.betId = ? AND w.userId = ? AND w.isSettled = 0",
);

export const insertAwardStmt = db.prepare(
  "INSERT INTO awards (userId, amount, description) VALUES (?, ?, ?)",
);

// Prepared statements for competitions
export const getCompetitionStmt = db.prepare(
  "SELECT * FROM competitions WHERE id = ?",
);

export const getAllCompetitionsStmt = db.prepare("SELECT * FROM competitions");

export const insertCompetitionStmt = db.prepare(
  "INSERT INTO competitions (description, entryFee, award) VALUES (?, ?, ?)",
);

export const updateCompetitionIsOpenStmt = db.prepare(
  "UPDATE competitions SET isOpen = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

export const updateCompetitionIsSettledStmt = db.prepare(
  "UPDATE competitions SET isSettled = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);

export const updateCompetitionEntryWinnerStmt = db.prepare(
  "UPDATE competition_entries SET isWinner = 1, settled = 1 WHERE competitionId = ? AND userId = ?",
);

export const updateCompetitionEntryAwardStmt = db.prepare(
  "UPDATE competition_entries SET settled = 1, isWinner = CASE WHEN ? > 0 THEN 1 ELSE 0 END, award = ? WHERE competitionId = ? AND userId = ?",
);

// Prepared statements for competition entries
export const insertCompetitionEntryStmt = db.prepare(
  "INSERT INTO competition_entries (userId, competitionId, settled, isWinner) VALUES (?, ?, ?, ?)",
);

export const getCompetitionEntriesByCompetitionStmt = db.prepare(
  "SELECT * FROM competition_entries WHERE competitionId = ?",
);

export const getCompetitionEntryStmt = db.prepare(
  "SELECT * FROM competition_entries WHERE competitionId = ? AND userId = ?",
);
