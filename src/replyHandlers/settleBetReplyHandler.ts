import { Message } from "discord.js";
import {
  buildSettleResultsMessage,
  getDisplayDescription,
  parseSettleResult,
} from "../common/settleHelpers";
import { Bet, BetTypes } from "../common/types";
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

  const messageContent = messageParts
    ? messageParts.slice(2).join(" ")
    : message.content;

  const betResult = parseSettleResult(messageContent, bet);
  if (betResult === null) {
    await message.reply(
      bet.type === BetTypes.MONEYLINE
        ? "Please reply with **settle** 'Yes' or 'No' to settle the bet."
        : "Please reply with **settle** 'Over', 'Under', or the actual result count to settle the bet.",
    );
    return;
  }

  const fiendsresults = settleBet(bet.id, betResult);
  const displayDescription = getDisplayDescription(bet);

  const resultsMessage = buildSettleResultsMessage(
    bet.id,
    betResult,
    fiendsresults,
    displayDescription,
  );

  await message.reply(resultsMessage);
}
