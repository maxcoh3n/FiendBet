import { ChatInputCommandInteraction } from "discord.js";
import { getFiend, createFiend } from "../database/dbController";
import { STARTING_BALANCE } from "../common/constants";

export default async function HandleBalance(
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user", true);
  const fiend = getFiend(user.id);

  if (!fiend) {
    createFiend(user.id, user.displayName);
    await interaction.reply(
      `New Fiend Created for ${user.displayName}! with ${STARTING_BALANCE} FiendBucks`,
    );
    return;
  }

  await interaction.reply(
    `${user} has ${fiend.balance} FiendBucks, and ${fiend.credit || 0} on credit!`,
  );
}
