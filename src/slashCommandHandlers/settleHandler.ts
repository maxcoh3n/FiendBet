import { ChatInputCommandInteraction } from "discord.js";
import { BetTypes, SpreadTypes } from "../common/types";
import {
  doesStringContainNo,
  doesStringContainYes,
  getNumberFromMessage,
  pingFiend,
  sendMessageEphemeral,
} from "../common/util";
import { getBet, settleBet } from "../database/dbController";

export default async function HandleSettle(
  interaction: ChatInputCommandInteraction,
) {
  const betId = interaction.options.getInteger("bet_id", true);
  const resultRaw = interaction.options.getString("result", true);

  const bet = getBet(betId);

  if (!bet) {
    await interaction.reply(`Sorry, Bet ${betId} not found.`);
    return;
  }

  if (bet.isSettled) {
    await interaction.reply(`Sorry, Bet ${betId} has already been settled.`);
    return;
  }

  let result;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (doesStringContainYes(resultRaw)) {
        result = true;
      } else if (doesStringContainNo(resultRaw)) {
        result = false;
      } else {
        sendMessageEphemeral(
          interaction,
          "Sorry, Moneyline bets result must be Yes/No",
        );
        return;
      }
      break;
    }
    case BetTypes.SPREAD: {
      if (
        resultRaw
          .toUpperCase()
          .includes(SpreadTypes.OVER.toString().toUpperCase())
      ) {
        result = SpreadTypes.OVER;
        break;
      }
      if (
        resultRaw
          .toUpperCase()
          .includes(SpreadTypes.UNDER.toString().toUpperCase())
      ) {
        result = SpreadTypes.UNDER;
        break;
      }
      const betResultValue = getNumberFromMessage(resultRaw);
      if (betResultValue) {
        if (!bet.spread) {
          throw new Error(
            "This shouldn't be possible, but I screwed up by making spreads and moneylines the same type",
          );
        }
        result =
          betResultValue > bet.spread ? SpreadTypes.OVER : SpreadTypes.UNDER;
        break;
      }

      sendMessageEphemeral(
        interaction,
        "Sorry, Spread bets result must be Over/Under or the exact value so I can calculate it for you",
      );
      return;

      break;
    }
  }

  const fiendsresults = settleBet(bet.id, result);
  const resultsMessage = fiendsresults
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${Math.abs(profit)} FiendBucks From this wager, and now has ${fiend.balance}`,
    )
    .join("\n");

  await interaction.reply(
    `Bet ID ${bet.id} has been settled with result: ${result}.\nResults:\n${resultsMessage}`,
  );
}
