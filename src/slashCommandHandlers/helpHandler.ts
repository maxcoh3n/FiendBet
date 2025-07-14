import { ChatInputCommandInteraction } from "discord.js";
import { helpMessage } from "../common/constants";

export default async function HandleHelp(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.reply({
    content: `${helpMessage}`,
    ephemeral: true,
  });
  return;
}
