import { ChatInputCommandInteraction } from "discord.js";
import {
  formatCompetitionCreateMessage,
  sendMessageEphemeral,
} from "../common/util";
import { createCompetition } from "../database/dbController";

export default async function HandleCreateCompetition(
  interaction: ChatInputCommandInteraction,
) {
  const description = interaction.options.getString("description", true);
  const entryFee = interaction.options.getInteger("entry_fee", true);
  const award = interaction.options.getInteger("award", false);

  if (!description) {
    await sendMessageEphemeral(interaction, "Description is required.");
    return;
  }

  if (entryFee === null || entryFee === undefined) {
    await sendMessageEphemeral(interaction, "Entry fee is required.");
    return;
  }

  try {
    const comp = createCompetition(description, entryFee, award ?? null);
    await interaction.reply(formatCompetitionCreateMessage(comp));
  } catch (err) {
    console.error("Error creating competition:", err);
    await sendMessageEphemeral(interaction, "Failed to create competition.");
  }
}
