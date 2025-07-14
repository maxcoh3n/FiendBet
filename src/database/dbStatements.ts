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
  "INSERT INTO bets (description, type, moneyLine, spread, isOpen, isSettled) VALUES (?, ?, ?, ?, ?, ?)",
);
export const closeBetStmt = db.prepare(
  "UPDATE bets SET isOpen = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
);
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
