import { ChatInputCommandInteraction } from "discord.js";

import { getUnsettledBets } from "../dbconnection";
import { BetTypes } from "../types";

export default async function betsResponse(
  interaction: ChatInputCommandInteraction,
) {
  const unsettledBets = getUnsettledBets();

  if (unsettledBets.length === 0) {
    await interaction.reply("There are no unsettled bets at the moment.");
    return;
  }

  const betList = unsettledBets
    .map(
      (bet) =>
        `**ID:** ${bet.id} | **Description:** ${bet.description} | **Type:** ${
          bet.type == BetTypes.MONEYLINE
            ? "Moneyline" +
              " | **Moneyline:** " +
              (bet.moneyLine && bet.moneyLine > 0
                ? "+" + bet.moneyLine
                : bet.moneyLine)
            : ""
        } ${
          bet.type == BetTypes.SPREAD
            ? "Spread" +
              " | **Spread:** " +
              (bet.spread && bet.spread > 0 ? "+" + bet.spread : bet.spread)
            : ""
        } | **Open:** ${bet.isOpen ? "Yes" : "No"}`, // todo also add open wagers
    )
    .join("\n");

  await interaction.reply(`Unsettled Bets:\n${betList}`);
}
