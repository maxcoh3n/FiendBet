CREATE TABLE competition_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  competitionId INTEGER NOT NULL,
  settled BOOLEAN DEFAULT 0,
  isWinner BOOLEAN DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES fiends(id),
  FOREIGN KEY (competitionId) REFERENCES competitions(id)
);
