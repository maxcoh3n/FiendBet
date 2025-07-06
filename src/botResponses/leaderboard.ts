import { ChatInputCommandInteraction } from "discord.js";
import { getAllFiends } from "../dbconnection";

export default async function leaderboardResponse(
  interaction: ChatInputCommandInteraction,
) {
  const users = getAllFiends();
  if (users.length === 0) {
    await interaction.reply("No users found!");
    return;
  }

  // Sort users by balance in descending order
  users.sort((a, b) => b.balance - a.balance);

  console.log("Leaderboard:", users);

  // Create leaderboard message
  const leaderboard = users
    .map(
      (user, index) =>
        `${index + 1}. <@${user.id}> - ${user.balance} FiendBucks`, // todo don't ping users here
    )
    .join("\n");

  await interaction.reply(`**Leaderboard:**\n${leaderboard}`);
}
