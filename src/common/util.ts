import { BetTypes, Bet, FiendWager } from "./types";

export function betToString(bet: Bet): string {
  return `${bet.description}\n${
    bet.type == BetTypes.MONEYLINE
      ? "**Moneyline:** " +
        (bet.moneyLine && bet.moneyLine > 0
          ? "+" + bet.moneyLine
          : bet.moneyLine)
      : ""
  }${
    bet.type == BetTypes.SPREAD
      ? "**Spread:** " +
        (bet.spread && bet.spread > 0 ? "+" + bet.spread : bet.spread)
      : ""
  } ${bet.isOpen ? "" : "Closed" + "|"} | **ID:** ${bet.id} `;
}

export function fiendWagerToString(fiendWager: FiendWager): string {
  return `${fiendWager.name} wagered **${fiendWager.amount}** on ${
    fiendWager.choice
  } `;
}

export function getPayout(
  wagerAmount: number,
  isBetWon: boolean,
  type: BetTypes,
  moneyLine: number = 0,
): number {
  if (!isBetWon) {
    return -wagerAmount;
  }
  if (type === BetTypes.MONEYLINE) {
    return (
      wagerAmount * (moneyLine > 0 ? moneyLine / 100 : 100 / (-1 * moneyLine))
    );
  } else if (type === BetTypes.SPREAD) {
    return wagerAmount;
  }
  return 0; // Default case, no payout
}

export function getBetId(messageContent: string): number | false {
  const betIdMatch = messageContent.match(/\*\*ID:\*\*\s*(-?\d+(\.\d+)?)/);
  if (betIdMatch) {
    return Number(betIdMatch[1]);
  }
  return false;
}

export function getNumberFromMessage(messageContent: string): number | false {
  const numbers = messageContent.match(/-?\d+(\.\d+)?/g);
  if (numbers && numbers.length == 1) {
    return Number(numbers[0]);
  }
  return false;
}

export function pingFiend(userId: string): string {
  return `<@${userId}>`;
}
