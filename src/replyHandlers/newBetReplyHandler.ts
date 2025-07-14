import { Message } from "discord.js";
import {
  addFiendBucks,
  addFiendCredit,
  createFiend,
  getFiend,
  closeBet,
  settleBet,
} from "../dbconnection";
import { getBet } from "../dbconnection";
import { BetTypes, SpreadTypes } from "../types";
import { semanticYes, semanticNo, STARTING_BALANCE } from "../constants";
import { createWager } from "../dbconnection";
import { Fiend } from "../types";
import { getBetId, getNumberFromMessage, pingFiend } from "../util";

export default async function handleNewBetReply(
  message: Message,
  repliedMessage: Message,
) {
  let fiend = getFiend(message.author.id);

  if (!fiend) {
    fiend = createFiend(message.author.id, message.author.displayName);
    await message.reply(
      `New Fiend Created for ${message.author.displayName}! with ${STARTING_BALANCE} FiendBucks`,
    );
  }

  if (message.content.includes("wager")) {
    await wagerReplyHandler(message, repliedMessage, fiend);
    return;
  } else if (message.content.includes("close")) {
    await closeBetReplyHandler(message, repliedMessage);
    return;
  } else if (message.content.includes("settle")) {
    await settleBetReplyHandler(message, repliedMessage);
    return;
  } else {
    await message.reply(
      "Please reply to a bet creation message with 'wager', 'close', or 'settle'.",
    );
    return;
  }
}

async function wagerReplyHandler(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
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

  if (!bet.isOpen) {
    await message.reply(
      `Bet ID ${betId} is closed. You cannot place a wager on it.`,
    );
    return;
  }

  if (bet.isSettled) {
    await message.reply(
      `Bet ID ${betId} has already been settled. You cannot place a wager on it.`,
    );
    return;
  }

  let betChoice = null;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (
        semanticYes.some((yes) => message.content.toLowerCase().includes(yes))
      ) {
        betChoice = true;
      } else if (
        semanticNo.some((no) => message.content.toLowerCase().includes(no))
      ) {
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
    betId,
    wagerValue,
    betChoice,
  );
  await message.react("✅");
}

async function closeBetReplyHandler(message: Message, repliedMessage: Message) {
  const betId = getBetId(repliedMessage.content);

  if (!betId) {
    await message.reply(
      `BetId not found in message. Something has gone horribly wrong.`,
    );
    return;
  }
  const bet = getBet(betId);

  if (!bet) {
    await message.reply("Bet not found. Please try again.");
    return;
  }

  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  bet.isOpen = false;
  closeBet(betId);

  await message.reply(
    `Bet ID ${betId} has been closed. New bets can no longer be placed.`,
  );
}

async function settleBetReplyHandler(
  message: Message,
  repliedMessage: Message,
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
    await message.reply("Bet not found. Please try again.");
    return;
  }

  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  let betResult = null;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (
        semanticYes.some((yes) => message.content.toLowerCase().includes(yes))
      ) {
        betResult = true;
      } else if (
        semanticNo.some((no) => message.content.toLowerCase().includes(no))
      ) {
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

  const fiendsresults = settleBet(betId, betResult);
  const resultsMessage = fiendsresults
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${profit} FiendBucks From this wager, and now has ${fiend.balance}`,
    )
    .join("\n");

  await message.reply(
    `Bet ID ${betId} has been settled with result: ${bet.result}.\nResults:\n${resultsMessage}`,
  );
}
