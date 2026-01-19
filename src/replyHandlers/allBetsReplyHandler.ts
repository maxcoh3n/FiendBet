import { Message } from "discord.js";
import { Fiend } from "../common/types";
import { getNumberFromMessage } from "../common/util";
import { closeAllBets, getBet } from "../database/dbController";
import { settleBetReplyHandler } from "./settleBetReplyHandler";
import { voidBetReplyHandler } from "./voidBetReplyHandler";
import { wagerBetReplyHandler } from "./wagerBetReplyHandler";

export default async function handleAllBetsReply(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
) {
  const messageParts = message.content.split(/\s+/);
  const command = messageParts[0].toLowerCase();

  if (command === "close" || command === "lock") {
    await closeBetsReplyHandler(message);
    return;
  }

  if (command === "wager") {
    // Format: wager <betId> <amount> <yes/no|over/under>
    const betId = getNumberFromMessage(messageParts[1] || "");
    if (betId) {
      const bet = getBet(betId);
      if (bet) {
        await wagerBetReplyHandler(
          message,
          repliedMessage,
          fiend,
          bet,
          messageParts,
        );
        return;
      }
    }
    await message.reply("Please provide a valid bet ID to wager on.");
    return;
  }

  if (command === "settle") {
    // Format: settle <betId> <result>
    const betId = getNumberFromMessage(messageParts[1] || "");
    if (betId) {
      const bet = getBet(betId);
      if (bet) {
        await settleBetReplyHandler(message, repliedMessage, bet, messageParts);
        return;
      }
    }
    await message.reply("Please provide a valid bet ID to settle.");
    return;
  }

  if (command === "void") {
    // Format: void <betId>
    const betId = getNumberFromMessage(messageParts[1] || "");
    if (betId) {
      const bet = getBet(betId);
      if (bet) {
        await voidBetReplyHandler(message, repliedMessage, bet, messageParts);
        return;
      }
    }
    await message.reply("Please provide a valid bet ID to void.");
    return;
  }
}

async function closeBetsReplyHandler(message: Message) {
  await closeAllBets();
  await message.react("🔒");
}
