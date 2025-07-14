import { ChatInputCommandInteraction } from "discord.js";

import { getUnsettledBets } from "../database/dbconnection";
import { BetTypes } from "../common/types";
import { betToString } from "../common/util";

export default async function HandleBets(
  interaction: ChatInputCommandInteraction,
) {
  const unsettledBets = getUnsettledBets();

  if (unsettledBets.length === 0) {
    await interaction.reply("There are no unsettled bets at the moment.");
    return;
  }

  const betList = unsettledBets
    .map(
      (bet) => betToString(bet), // todo also add open wagers
    )
    .join("\n");

  await interaction.reply(`Unsettled Bets:\n${betList}`);
}
