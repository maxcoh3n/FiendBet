import { Message } from "discord.js";
import { SecretBetMessage } from "../common/constants";
import { Bet, BetTypes, SpreadTypes } from "../common/types";
import {
  doesStringContainNo,
  doesStringContainYes,
  getNumberFromMessage,
  pingFiend,
} from "../common/util";
import { settleBet } from "../database/dbController";

export async function settleBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  bet: Bet,
  messageParts?: string[],
) {
  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  let betResult = null;
  const messageContent = messageParts
    ? messageParts.slice(2).join(" ")
    : message.content;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (doesStringContainYes(messageContent)) {
        betResult = true;
      } else if (doesStringContainNo(messageContent)) {
        betResult = false;
      } else {
        await message.reply(
          "Please reply with **settle** 'Yes' or 'No' to settle the bet.",
        );
        return;
      }
      break;
    }
    case BetTypes.SPREAD: {
      if (
        messageContent
          .toUpperCase()
          .includes(SpreadTypes.OVER.toString().toUpperCase())
      ) {
        betResult = SpreadTypes.OVER;
        break;
      }
      if (
        messageContent
          .toUpperCase()
          .includes(SpreadTypes.UNDER.toString().toUpperCase())
      ) {
        betResult = SpreadTypes.UNDER;
        break;
      }
      const betResultValue = getNumberFromMessage(messageContent);
      if (betResultValue) {
        if (!bet.spread) {
          throw new Error(
            "This shouldn't be possible, but I screwed up by making spreads and moneylines the same type",
          );
        }
        betResult =
          betResultValue > bet.spread ? SpreadTypes.OVER : SpreadTypes.UNDER;
        break;
      }

      await message.reply(
        "Please reply with **settle** 'Over', 'Under', or the actual result count to settle the bet.",
      );
      return;

      break;
    }
  }

  const fiendsresults = settleBet(bet.id, betResult);
  const resultsMessage = fiendsresults
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${Math.abs(profit)} FiendBucks From this wager, and now has ${fiend.balance}`,
    )
    .join("\n");

  const displayDescription =
    bet.description === SecretBetMessage
      ? bet.secretDescription
      : bet.description && bet.secretDescription
        ? `${bet.description} - ${bet.secretDescription}`
        : bet.description;

  await message.reply(
    `Bet ID ${bet.id}: ${displayDescription} has been settled with result: ${betResult}.\nResults:\n${resultsMessage}`,
  );
}
