import { ChatInputCommandInteraction } from "discord.js";

import {
  getUnsettledBets,
  getFiendWagersByBet,
} from "../database/dbController";
import { betToString, fiendWagerToString } from "../common/util";

export default async function HandleBets(
  interaction: ChatInputCommandInteraction,
) {
  const unsettledBets = getUnsettledBets();

  if (unsettledBets.length === 0) {
    await interaction.reply("There are no unsettled bets at the moment.");
    return;
  }

  const betList = unsettledBets
    .map((bet) => betToString(bet) + "\n" + formatFiendWagers(bet.id))
    .join("\n");

  await interaction.reply(`Unsettled Bets:\n${betList}`);
}

function formatFiendWagers(betId: number): string {
  const wagers = getFiendWagersByBet(betId);
  return wagers.map((wager) => "    " + fiendWagerToString(wager)).join("\n");
}
