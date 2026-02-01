import { ChatInputCommandInteraction } from "discord.js";

import { AllBetsFooterMessage, UnsettledBetsMsg } from "../common/constants";
import { betToString, fiendWagerToString } from "../common/util";
import {
  getFiendWagersByBet,
  getUnsettledBets,
} from "../database/dbController";

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

  await interaction.reply(
    `${UnsettledBetsMsg}:\n${betList}${AllBetsFooterMessage}`,
  );
}

function formatFiendWagers(betId: number): string {
  const wagers = getFiendWagersByBet(betId);

  if (wagers.length === 0) {
    return "";
  }

  return (
    wagers.map((wager) => "    " + fiendWagerToString(wager)).join("\n") + "\n"
  );
}
