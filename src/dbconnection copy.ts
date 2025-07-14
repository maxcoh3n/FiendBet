import { BetTypes, SpreadTypes, Fiend, Bet, Wager } from "./common/types";
import { getPayout } from "./common/util";
import { STARTING_BALANCE } from "./common/constants";

const fiendsMap: { [userId: string]: Fiend } = {};
const betsMap: { [betId: number]: Bet } = {};
let highestBetId = 0;
const wagersMap: { [wagerId: number]: Wager } = {};
let highestWagerId = 0;

export function addFiendBucks(userId: string, amount: number): Fiend {
  if (!fiendsMap[userId]) {
    throw new Error("User does not exist");
  }
  fiendsMap[userId].balance += amount;
  return fiendsMap[userId];
}

export function addFiendCredit(userId: string, amount: number): Fiend {
  if (!fiendsMap[userId]) {
    throw new Error("User does not exist");
  }
  if (!fiendsMap[userId].credit) {
    fiendsMap[userId].credit = 0;
  }
  fiendsMap[userId].credit += amount;
  return fiendsMap[userId];
}

export function getFiend(userId: string): Fiend | undefined {
  return fiendsMap[userId];
}

export function getAllFiends(): Fiend[] {
  return Object.values(fiendsMap);
}

export function createFiend(userId: string, name: string): Fiend {
  if (fiendsMap[userId]) {
    throw new Error("Fiend already exists");
  }
  fiendsMap[userId] = { id: userId, name, balance: STARTING_BALANCE };
  return fiendsMap[userId];
}

export function createBet(
  description: string,
  type: BetTypes,
  moneyLine: number | undefined = undefined,
  spread: number | undefined = undefined,
): Bet {
  const id = ++highestBetId;

  if (type === BetTypes.MONEYLINE && !moneyLine) {
    throw new Error("Moneyline value must be provided for moneyline bets");
  }

  if (type === BetTypes.SPREAD && !spread) {
    throw new Error("Spread value must be provided for spread bets");
  }

  betsMap[id] = {
    id,
    description,
    type,
    isOpen: true,
    isSettled: false,
    moneyLine,
    spread,
    result: undefined,
  };
  return betsMap[id];
}

export function getBet(id: number): Bet | null {
  return betsMap[id] || null;
}

export function getUnsettledBets(): Bet[] {
  return Object.values(betsMap).filter((bet) => !bet.isSettled);
}

/*
 * Closes a bet to new wagers by setting its isOpen property to false.
 * This does not settle the bet; it just marks it as closed.
 */
export function closeBet(id: number): void {
  if (betsMap[id]) {
    betsMap[id].isOpen = false;
  }
}

export function voidBet(id: number): void {
  if (!betsMap[id]) {
    throw new Error("Bet does not exist");
  }

  if (betsMap[id].isSettled) {
    throw new Error("Bet is already settled");
  }

  betsMap[id].isOpen = false;
  betsMap[id].isSettled = true;

  //todo subtract the amount from each wager from the fiend's credit and mark the wager as settled
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
  if (!betsMap[id]) {
    throw new Error("Bet does not exist");
  }

  if (betsMap[id].isSettled) {
    throw new Error("Bet is already settled");
  }

  if (betsMap[id]) {
    // todo must be SQL
    betsMap[id].isSettled = true;
    betsMap[id].result = result;
    betsMap[id].isOpen = false;
  }

  const wagers = (Object.values(wagersMap) as Wager[]).filter(
    (wager) => wager.betId === id && !wager.isSettled,
  );

  const results: [Fiend, number][] = [];

  for (const wager of wagers) {
    wager.isSettled = true; //todo must be SQL
    wager.result = result;
    const fiend = fiendsMap[wager.userId];
    let payout = 0;
    const isBetWon = wager.choice === result;
    payout = getPayout(
      wager.amount,
      isBetWon,
      betsMap[id].type,
      betsMap[id].moneyLine,
    );
    addFiendBucks(fiend.id, payout);
    addFiendCredit(fiend.id, -wager.amount);

    results.push([fiend, payout]);
  }

  return results;
}

/* creates awager for a bet and adds that amount to the fiend's credit balance
 */
export function createWager(
  userId: string,
  betId: number,
  amount: number,
  choice: boolean | SpreadTypes,
): [Wager, Fiend] {
  if (!fiendsMap[userId]) {
    throw new Error("User does not exist");
  }
  if (!betsMap[betId] || !betsMap[betId].isOpen) {
    throw new Error("Bet does not exist or is not open");
  }

  if (betsMap[betId].isSettled) {
    throw new Error("Bet is already settled");
  }

  if (!betsMap[betId].isOpen) {
    throw new Error("Bet is not open for wagering");
  }

  if (
    betsMap[betId].type === BetTypes.MONEYLINE &&
    !(choice === true || choice === false)
  ) {
    throw new Error("Boolean choice must be provided for moneyline bets");
  }

  if (
    betsMap[betId].type === BetTypes.SPREAD &&
    !(choice === SpreadTypes.OVER || choice === SpreadTypes.UNDER)
  ) {
    throw new Error("Over/Under choice must be provided for spread bets");
  }

  const wagerId = ++highestWagerId;
  wagersMap[wagerId] = {
    id: wagerId,
    userId,
    betId,
    amount,
    choice,
    isSettled: false,
  };

  const fiend = addFiendCredit(userId, amount);

  return [wagersMap[wagerId], fiend];
}
