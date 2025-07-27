import { ChatInputCommandInteraction } from "discord.js";
import { helpMessage } from "../common/constants";
import { sendMessageEphemeral } from "../common/util";

export default async function HandleHelp(
  interaction: ChatInputCommandInteraction,
) {
  await sendMessageEphemeral(interaction, helpMessage);
  return;
}
