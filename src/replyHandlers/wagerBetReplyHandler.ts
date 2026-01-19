import { Message } from "discord.js";
import { Bet, BetTypes, Fiend, SpreadTypes } from "../common/types";
import {
  doesStringContainNo,
  doesStringContainYes,
  getNumberFromMessage,
} from "../common/util";
import { createWager } from "../database/dbController";

export async function wagerBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
  bet: Bet,
  messageParts?: string[],
) {
  const wagerValue = messageParts
    ? getNumberFromMessage(messageParts.slice(2).join(" "))
    : getNumberFromMessage(message.content);

  if (!wagerValue) {
    await message.reply("Please reply with one positive number.");
    return;
  }

  if (wagerValue > fiend.balance) {
    await message.reply(
      `You don't have enough FiendBucks to place this wager. Your balance is ${fiend.balance} FiendBucks.`,
    );
    return;
  }

  if (!bet.isOpen) {
    await message.reply(
      `Bet ID ${bet.id} is closed. You cannot place a wager on it.`,
    );
    return;
  }

  if (bet.isSettled) {
    await message.reply(
      `Bet ID ${bet.id} has already been settled. You cannot place a wager on it.`,
    );
    return;
  }

  let betChoice = null;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (doesStringContainYes(message.content)) {
        betChoice = true;
      } else if (doesStringContainNo(message.content)) {
        betChoice = false;
      } else {
        await message.reply(
          "Please reply with **wager** 'Yes' or 'No' to place a wager.",
        );
        return;
      }
      break;
    }
    case BetTypes.SPREAD: {
      if (
        message.content
          .toUpperCase()
          .includes(SpreadTypes.OVER.toString().toUpperCase())
      ) {
        betChoice = SpreadTypes.OVER;
        break;
      }
      if (
        message.content
          .toUpperCase()
          .includes(SpreadTypes.UNDER.toString().toUpperCase())
      ) {
        betChoice = SpreadTypes.UNDER;
        break;
      }

      await message.reply(
        "Please reply with **wager** 'Over' or 'Under' to place a wager.",
      );
      return;
    }
  }

  if (betChoice !== null) {
    const [wager, fiendResult] = createWager(
      message.author.id,
      bet.id,
      wagerValue,
      betChoice,
    );
    await message.react("✅");
  }
}
