import { Message } from "discord.js";
import {
  addFiendBucks,
  addFiendCredit,
  createFiend,
  getFiend,
  closeBet,
  settleBet,
  voidBet,
} from "../database/dbconnection";
import { getBet } from "../database/dbconnection";
import { BetTypes, SpreadTypes } from "../common/types";
import { semanticYes, semanticNo, STARTING_BALANCE } from "../common/constants";
import { createWager } from "../database/dbconnection";
import { Fiend, Bet } from "../common/types";
import { getBetId, getNumberFromMessage, pingFiend } from "../common/util";

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

  if (message.content.includes("wager")) {
    await wagerReplyHandler(message, repliedMessage, fiend, bet);
    return;
  } else if (message.content.includes("close")) {
    await closeBetReplyHandler(message, repliedMessage, bet);
    return;
  } else if (message.content.includes("settle")) {
    await settleBetReplyHandler(message, repliedMessage, bet);
    return;
  } else if (message.content.includes("void")) {
    await voidBetReplyHandler(message, repliedMessage, bet);
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

  await message.reply(
    `Bet ID ${bet.id} has been closed. New bets can no longer be placed.`,
  );
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

  const fiendsresults = settleBet(bet.id, betResult);
  const resultsMessage = fiendsresults
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${profit} FiendBucks From this wager, and now has ${fiend.balance}`,
    )
    .join("\n");

  await message.reply(
    `Bet ID ${bet.id} has been settled with result: ${bet.result}.\nResults:\n${resultsMessage}`,
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
