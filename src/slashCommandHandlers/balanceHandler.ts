import { ChatInputCommandInteraction } from "discord.js";
import { STARTING_BALANCE } from "../common/constants";
import { getServerNickname, roundToTwoDecimals } from "../common/util";
import { createFiend, getFiend } from "../database/dbController";

export default async function HandleBalance(
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user", true);
  const fiend = getFiend(user.id);

  if (!fiend) {
    const name = await getServerNickname(user, interaction);
    createFiend(user.id, name);
    await interaction.reply(
      `New Fiend Created for ${name} with ${STARTING_BALANCE} FiendBucks!`,
    );
    return;
  }

  await interaction.reply(
    `${fiend.name} has ${roundToTwoDecimals(fiend.balance)} FiendBucks, and ${roundToTwoDecimals(fiend.credit || 0)} on credit!`,
  );
}
