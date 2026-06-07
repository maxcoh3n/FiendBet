import { ChatInputCommandInteraction } from "discord.js";
import { UnsettledCompetitionsMsg } from "../common/constants";
import { competitionEntryToString, competitionToString } from "../common/util";
import {
  getCompetitionEntriesByCompetition,
  getFiend,
  getUnsettledCompetitions,
} from "../database/dbController";

export default async function HandleCompetitions(
  interaction: ChatInputCommandInteraction,
) {
  const competitions = getUnsettledCompetitions();

  if (competitions.length === 0) {
    await interaction.reply(
      "There are no unsettled competitions at the moment.",
    );
    return;
  }

  const competitionBlocks = await Promise.all(
    competitions.map(async (competition) => {
      const entries = getCompetitionEntriesByCompetition(competition.id);
      const entrantLines = await Promise.all(
        entries.map(async (entry) => {
          const fiend = getFiend(entry.userId);
          if (fiend) {
            return competitionEntryToString(entry, fiend.name);
          }

          if (!interaction.guild) {
            return competitionEntryToString(entry, entry.userId);
          }

          try {
            const member = await interaction.guild.members.fetch(entry.userId);
            return competitionEntryToString(
              entry,
              member?.displayName ?? entry.userId,
            );
          } catch {
            return competitionEntryToString(entry, entry.userId);
          }
        }),
      );

      const entrantsText = entrantLines.length
        ? entrantLines.map((line) => `    ${line}`).join("\n")
        : "    (no entrants yet)";

      return competitionToString(competition) + "\n" + entrantsText;
    }),
  );

  await interaction.reply(
    `${UnsettledCompetitionsMsg}:\n${competitionBlocks.join("\n\n")}`,
  );
}
