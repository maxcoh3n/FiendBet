import { ChatInputCommandInteraction } from "discord.js";
import { getAllFiends } from "../database/dbController";

export default async function HandleLeaderboard(
  interaction: ChatInputCommandInteraction,
) {
  const users = getAllFiends();
  if (users.length === 0) {
    await interaction.reply("No users found!");
    return;
  }

  // Sort users by balance in descending order
  users.sort((a, b) => b.balance - a.balance);

  // Create leaderboard message
  const leaderboard = users
    .map(
      (user, index) =>
        `${index + 1}. ${user.name} - ${user.balance} FiendBucks`, // todo don't ping users here
    )
    .join("\n");

  await interaction.reply(`**Leaderboard:**\n${leaderboard}`);
}
