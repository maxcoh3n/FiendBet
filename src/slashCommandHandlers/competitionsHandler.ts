import { ChatInputCommandInteraction } from "discord.js";
import { UnsettledCompetitionsMsg } from "../common/constants";
import {
  competitionEntryToString,
  competitionToString,
  roundToTwoDecimals,
} from "../common/util";
import {
  getCompetitionEntriesByCompetition,
  getFiend,
  getSettledCompetitions,
  getUnsettledCompetitions,
} from "../database/dbController";

export default async function HandleCompetitions(
  interaction: ChatInputCommandInteraction,
) {
  const subcommand = interaction.options.getSubcommand(false);

  if (subcommand === "settled") {
    const competitions = getSettledCompetitions();

    if (competitions.length === 0) {
      await interaction.reply(
        "There are no settled competitions at the moment.",
      );
      return;
    }

    const competitionMessages = await Promise.all(
      competitions.map(async (competition) => {
        const entries = getCompetitionEntriesByCompetition(competition.id);

        const entrantNames = await Promise.all(
          entries.map(async (entry) => {
            const fiend = getFiend(entry.userId);
            if (fiend) {
              return fiend.name;
            }

            if (!interaction.guild) {
              return entry.userId;
            }

            try {
              const member = await interaction.guild.members.fetch(
                entry.userId,
              );
              return member?.displayName ?? entry.userId;
            } catch {
              return entry.userId;
            }
          }),
        );

        const resultsText = entries
          .map((entry, index) => {
            const name = entrantNames[index];
            const netAmount = (entry.award ?? 0) - entry.entryFee;
            const entryText =
              entry.entries > 1 ? ` with ${entry.entries} entries` : "";
            return `${name} ${netAmount > 0 ? "gained" : "lost"} ${roundToTwoDecimals(
              Math.abs(netAmount),
            )} FiendBucks${entryText}`;
          })
          .join("\n");

        const header = competition.description
          ? `Competition ID: ${competition.id}) ${competition.description}`
          : `Competition ID ${competition.id})`;

        return `${header}\nResults:\n${resultsText}`;
      }),
    );

    await interaction.reply(competitionMessages.join("\n\n"));
    return;
  }

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
