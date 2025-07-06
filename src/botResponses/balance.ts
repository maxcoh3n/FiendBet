import { ChatInputCommandInteraction } from "discord.js";
import { getFiend, createFiend } from "../dbconnection";

export default async function balanceResponse(
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user", true);
  const fiend = getFiend(user.id);

  if (!fiend) {
    createFiend(user.id, user.displayName);
    await interaction.reply(
      `New Fiend Created for ${user.displayName}! with 100 FiendBucks`,
    );
    return;
  }

  await interaction.reply(`${user} has ${fiend.balance} FiendBucks!`);
}
