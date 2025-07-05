import { BetTypes, SpreadTypes, Fiend, Bet, Wager } from "./types";

const usersMap: { [userId: string]: Fiend } = {};
const betsMap: { [betId: number]: Bet } = {};
let highestBetId = 0;
const wagersMap: { [wagerId: number]: Wager } = {};
let highestWagerId = 0;

export function setFiendBucks(userId: string, amount: number): Fiend {
  if (!usersMap[userId]) {
    throw new Error("User does not exist");
  }
  usersMap[userId].balance = amount;
  return usersMap[userId];
}

export function addFiendBucks(userId: string, amount: number): Fiend {
  if (!usersMap[userId]) {
    throw new Error("User does not exist");
  }
  usersMap[userId].balance += amount;
  return usersMap[userId];
}

export function getFiend(userId: string): Fiend | undefined {
  return usersMap[userId];
}

export function getAllFiends(): Fiend[] {
  return Object.values(usersMap);
}

export function createFiend(userId: string, name: string): Fiend {
  if (usersMap[userId]) {
    throw new Error("User already exists");
  }
  usersMap[userId] = { id: userId, name, balance: 100 }; // Default balance
  return usersMap[userId];
}

export function createBet(
  description: string,
  type: BetTypes,
  moneyLine: number | undefined = undefined,
  spread: number | undefined = undefined,
): number {
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
  return id;
}

export function getBet(id: number): Bet | null {
  return betsMap[id] || null;
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

/*
 * Settles a bet by setting its isSettled property to true and assigning a result.
 * Also pays out results to users who wagered on the bet.
 * The result can be any value that indicates the outcome of the bet.
 */
export function settleBet(id: number, result: any): void {
  if (!betsMap[id]) {
    throw new Error("Bet does not exist");
  }

  if (betsMap[id].isSettled) {
    throw new Error("Bet is already settled");
  }

  if (betsMap[id]) {
    betsMap[id].isSettled = true;
    betsMap[id].result = result;
    betsMap[id].isOpen = false;
  }

  const wagers = (Object.values(wagersMap) as Wager[]).filter(
    (wager) => wager.betId === id && !wager.isSettled,
  );

  for (const wager of wagers) {
    // TODO: Implement payout logic
  }
}

export function createWager(
  userId: string,
  betId: number,
  amount: number,
  choice: boolean | SpreadTypes,
): number {
  if (!usersMap[userId]) {
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

  usersMap[userId].balance -= amount; // Deduct the wager amount from user's fiend bucks
  return wagerId;
}
