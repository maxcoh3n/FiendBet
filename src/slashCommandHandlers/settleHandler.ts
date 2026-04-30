import { ChatInputCommandInteraction } from "discord.js";
import {
  buildSettleResultsMessage,
  getDisplayDescription,
  parseSettleResult,
} from "../common/settleHelpers";
import { BetTypes } from "../common/types";
import { sendMessageEphemeral } from "../common/util";
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

  const result = parseSettleResult(resultRaw, bet);
  if (result === null) {
    sendMessageEphemeral(
      interaction,
      bet.type === BetTypes.MONEYLINE
        ? "Sorry, Moneyline bets result must be Yes/No"
        : "Sorry, Spread bets result must be Over/Under or the exact value so I can calculate it for you",
    );
    return;
  }

  const fiendsresults = settleBet(bet.id, result);
  const displayDescription = getDisplayDescription(bet);
  const resultsMessage = buildSettleResultsMessage(
    bet.id,
    result,
    fiendsresults,
    displayDescription,
  );

  await interaction.reply(resultsMessage);
}
