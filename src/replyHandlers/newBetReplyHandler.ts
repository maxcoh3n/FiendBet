import { Message } from "discord.js";
import { Bet, Fiend } from "../common/types";
import { getBetId } from "../common/util";
import { closeBet, getBet } from "../database/dbController";
import { settleBetReplyHandler } from "./settleBetReplyHandler";
import { voidBetReplyHandler } from "./voidBetReplyHandler";
import { wagerBetReplyHandler } from "./wagerBetReplyHandler";

export default async function handleNewBetReply(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
) {
  const betId = getBetId(repliedMessage.content);

  if (!betId) {
    await message.reply(
      `BetId not found in message. Something has gone horribly wrong.`,
    );
    return;
  }
  const bet = getBet(betId);

  if (!bet) {
    await message.reply(`Bet ${betId} not found. Please try again.`);
    return;
  }

  const messageContentLower = message.content.toLowerCase();

  if (messageContentLower.includes("wager")) {
    await wagerBetReplyHandler(message, repliedMessage, fiend, bet);
    return;
  }
  if (
    messageContentLower.includes("close") ||
    messageContentLower.includes("lock")
  ) {
    await closeBetReplyHandler(message, repliedMessage, bet);
    return;
  }
  if (messageContentLower.includes("settle")) {
    await settleBetReplyHandler(message, repliedMessage, bet);
    return;
  }
  if (messageContentLower.includes("void")) {
    await voidBetReplyHandler(message, repliedMessage, bet);
    return;
  }
  await message.reply(
    "Please reply to a bet creation message with 'wager', 'close', or 'settle'.",
  );
  return;
}

async function closeBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  bet: Bet,
) {
  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  bet.isOpen = false;
  closeBet(bet.id);

  await message.react("🔒");
}
