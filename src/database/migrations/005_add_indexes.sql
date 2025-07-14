CREATE INDEX idx_wagers_bet_id ON wagers(betId);
CREATE INDEX idx_wagers_user_id ON wagers(userId);
CREATE INDEX idx_wagers_is_settled ON wagers(isSettled);
CREATE INDEX idx_bets_is_open ON bets(isOpen);
CREATE INDEX idx_bets_is_settled ON bets(isSettled);
CREATE INDEX idx_bets_date ON bets(date);
CREATE INDEX idx_awards_user_id ON awards(userId);