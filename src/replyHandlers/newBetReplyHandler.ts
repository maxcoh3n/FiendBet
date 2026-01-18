import { Message } from "discord.js";
import { SecretBetMessage } from "../common/constants";
import { Bet, BetTypes, Fiend, SpreadTypes } from "../common/types";
import {
  doesStringContainNo,
  doesStringContainYes,
  getBetId,
  getNumberFromMessage,
  pingFiend,
} from "../common/util";
import {
  closeBet,
  createWager,
  getBet,
  settleBet,
  voidBet,
} from "../database/dbController";

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
    await wagerReplyHandler(message, repliedMessage, fiend, bet);
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

async function wagerReplyHandler(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
  bet: Bet,
) {
  const wagerValue = getNumberFromMessage(message.content);

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
          "Please reply with 'Yes' or 'No' to place a wager.",
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

  const [wager, fiendResult] = createWager(
    message.author.id,
    bet.id,
    wagerValue,
    betChoice,
  );
  await message.react("✅");
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

async function settleBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  bet: Bet,
) {
  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  let betResult = null;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (doesStringContainYes(message.content)) {
        betResult = true;
      } else if (doesStringContainNo(message.content)) {
        betResult = false;
      } else {
        await message.reply(
          "Please reply with 'Yes' or 'No' to settle the bet.",
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
        betResult = SpreadTypes.OVER;
        break;
      }
      if (
        message.content
          .toUpperCase()
          .includes(SpreadTypes.UNDER.toString().toUpperCase())
      ) {
        betResult = SpreadTypes.UNDER;
        break;
      }
      const betResultValue = getNumberFromMessage(message.content);
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
        "Please reply with **settle** 'Over', 'Under' or the final exact count to settle the bet, ",
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
      : bet.description;

  await message.reply(
    `Bet ID ${bet.id}: ${displayDescription} has been settled with result: ${betResult}.\nResults:\n${resultsMessage}`,
  );
}

async function voidBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  bet: Bet,
) {
  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  bet.isOpen = false;
  bet.isSettled = true;
  voidBet(bet.id);

  await message.reply(
    `Bet ID ${bet.id} has been voided. All wagers have been uncredited.`,
  );
}
