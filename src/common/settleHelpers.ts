import { SecretBetMessage } from "./constants";
import { Bet, BetTypes, Fiend, SpreadTypes } from "./types";
import {
  doesStringContainNo,
  doesStringContainYes,
  getNumberFromMessage,
  pingFiend,
} from "./util";

export type SettleResult = boolean | SpreadTypes;

export function roundto2decimal(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getDisplayDescription(bet: Bet): string | undefined {
  if (bet.description === SecretBetMessage) {
    return bet.secretDescription;
  }
  if (bet.description && bet.secretDescription) {
    return `${bet.description} - ${bet.secretDescription}`;
  }
  return bet.description;
}

export function parseSettleResult(
  resultRaw: string,
  bet: Bet,
): SettleResult | null {
  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (resultRaw && resultRaw.length > 0) {
        if (doesStringContainYes(resultRaw)) {
          return true;
        }
        if (doesStringContainNo(resultRaw)) {
          return false;
        }
      }
      return null;
    }
    case BetTypes.SPREAD: {
      const normalized = resultRaw.toUpperCase();
      if (normalized.includes(SpreadTypes.OVER.toString().toUpperCase())) {
        return SpreadTypes.OVER;
      }
      if (normalized.includes(SpreadTypes.UNDER.toString().toUpperCase())) {
        return SpreadTypes.UNDER;
      }

      const betResultValue = getNumberFromMessage(resultRaw);
      if (betResultValue !== false) {
        if (!bet.spread) {
          throw new Error(
            "This shouldn't be possible, but I screwed up by making spreads and moneylines the same type",
          );
        }
        return betResultValue > bet.spread
          ? SpreadTypes.OVER
          : SpreadTypes.UNDER;
      }

      return null;
    }
  }
}

export function buildSettleResultsMessage(
  betId: number,
  betResult: SettleResult,
  results: [Fiend, number][],
  displayDescription?: string,
) {
  const resultsMessage = results
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${roundto2decimal(
          Math.abs(profit),
        )} FiendBucks From this wager, and now has ${roundto2decimal(fiend.balance)}`,
    )
    .join("\n");

  const header = displayDescription
    ? `Bet ID: ${betId}) ${displayDescription}`
    : `Bet ID ${betId})`;

  return `${header} has been settled with result: ${betResult}.
Results:
${resultsMessage}`;
}
