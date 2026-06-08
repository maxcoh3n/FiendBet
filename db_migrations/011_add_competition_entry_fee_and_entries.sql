ALTER TABLE competition_entries ADD COLUMN entry_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE competition_entries ADD COLUMN entries INTEGER NOT NULL DEFAULT 1;

UPDATE competition_entries
SET entry_fee = COALESCE(
  (SELECT entryFee FROM competitions WHERE competitions.id = competition_entries.competitionId),
  0
),
entries = 1;