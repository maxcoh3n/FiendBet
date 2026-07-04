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
  id: number,
  betResult: SettleResult | null,
  results: [Fiend, number][],
  displayDescription?: string,
  subjectLabel = "Bet",
  useMentions = true,
  entriesByUser?: Map<string, number>,
) {
  const resultsMessage = results
    .map(([fiend, profit]) => {
      const userLabel = useMentions ? pingFiend(fiend.id) : fiend.name;
      const entries = entriesByUser?.get(fiend.id) ?? 1;
      const entryText = entries > 1 ? ` with ${entries} entries` : "";
      const roundedProfit = roundto2decimal(Math.abs(profit));
      return `${userLabel} ${profit > 0 ? "gained" : "lost"} ${roundedProfit} FiendBucks${entryText} from this ${subjectLabel.toLowerCase()}, and now has ${roundto2decimal(
        fiend.balance,
      )}`;
    })
    .join("\n");

  const header = displayDescription
    ? `${subjectLabel} ID: ${id}) ${displayDescription}`
    : `${subjectLabel} ID ${id})`;

  const settledLine =
    betResult !== null
      ? `${header} has been settled with result: ${betResult}.`
      : `${subjectLabel} #${id} has been settled.`;

  return `${settledLine}
Results:
${resultsMessage}`;
}
