import { ChatInputCommandInteraction } from "discord.js";

import { AllBetsFooterMessage, UnsettledBetsMsg } from "../common/constants";
import {
  betToString,
  fiendWagerToString,
  getServerNickname,
} from "../common/util";
import {
  getFiend,
  getFiendWagersByBet,
  getFiendWagersByBetAndUser,
  getUnsettledBets,
  getUnsettledBetsByUser,
} from "../database/dbController";

export default async function HandleBets(
  interaction: ChatInputCommandInteraction,
) {
  const userOption = interaction.options.getUser("user");

  if (userOption) {
    const userId = userOption.id;
    const fiend = getFiend(userId);
    const username = fiend
      ? fiend.name
      : await getServerNickname(userOption, interaction);
    const unsettledBets = getUnsettledBetsByUser(userId);

    if (unsettledBets.length === 0) {
      await interaction.reply(`No unsettled bets found for ${username}.`);
      return;
    }

    const betList = unsettledBets
      .map(
        (bet) =>
          betToString(bet) + "\n" + formatFiendWagersForUser(bet.id, userId),
      )
      .join("\n");

    await interaction.reply(
      `${UnsettledBetsMsg} for ${username}:\n${betList}${AllBetsFooterMessage}`,
    );
  } else {
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

function formatFiendWagersForUser(betId: number, userId: string): string {
  const wagers = getFiendWagersByBetAndUser(betId, userId);

  if (wagers.length === 0) {
    return "";
  }

  return (
    wagers.map((wager) => "    " + fiendWagerToString(wager)).join("\n") + "\n"
  );
}
