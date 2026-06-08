import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { buildSettleResultsMessage } from "../common/settleHelpers";
import { CompetitionEntry } from "../common/types";
import { sendMessageEphemeral } from "../common/util";
import {
  getCompetition,
  getCompetitionEntriesByCompetition,
  getFiend,
  hasCompetitionEntry,
  settleCompetition,
} from "../database/dbController";

const MODAL_CUSTOM_ID_PREFIX = "settleCompetitionModal:";
const MODAL_FIELD_PAYOUTS = "competitionPayouts";

export async function HandleSettleCompetition(
  interaction: ChatInputCommandInteraction,
) {
  const competitionId = interaction.options.getInteger("competition_id", true);
  const winner = interaction.options.getUser("winner", false);

  const competition = getCompetition(competitionId);
  if (!competition) {
    await sendMessageEphemeral(
      interaction,
      `Competition ${competitionId} not found.`,
    );
    return;
  }

  if (competition.isSettled) {
    await sendMessageEphemeral(
      interaction,
      `Competition ${competitionId} has already been settled.`,
    );
    return;
  }

  const entries = getCompetitionEntriesByCompetition(competitionId);
  if (entries.length === 0) {
    await sendMessageEphemeral(
      interaction,
      `Competition ${competitionId} has no entrants to settle.`,
    );
    return;
  }

  if (winner) {
    if (
      competition.award === null ||
      competition.award === undefined ||
      competition.award === 0
    ) {
      await sendMessageEphemeral(
        interaction,
        "Competition must have a set award to have a single winner.",
      );
      return;
    }

    const winnerId = winner.id;
    if (!hasCompetitionEntry(winnerId, competitionId)) {
      await sendMessageEphemeral(
        interaction,
        `User <@${winnerId}> did not enter competition #${competitionId}.`,
      );
      return;
    }

    try {
      const awards = entries.map((entry) => ({
        userId: entry.userId,
        amount: entry.userId === winnerId ? competition.award! : 0,
      }));
      const results = settleCompetition(competitionId, awards);
      results.sort((a, b) => b[1] - a[1]);
      const resultsMessage = buildSettleResultsMessage(
        competitionId,
        null,
        results,
        competition.description,
        "Competition",
        true,
      );
      await interaction.reply({ content: resultsMessage });
    } catch (err: any) {
      console.error("Error settling competition:", err);
      await interaction.reply({
        content:
          err?.message ||
          "Failed to settle competition. Please check the payout format and try again.",
        ephemeral: true,
      });
    }

    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`${MODAL_CUSTOM_ID_PREFIX}${competitionId}`)
    .setTitle(`Settle Competition #${competitionId}`);

  const template = entriesToTemplate(entries);

  const payoutsInput = new TextInputBuilder()
    .setCustomId(MODAL_FIELD_PAYOUTS)
    .setLabel("Payouts for each entrant (ignore entry fees)")
    .setStyle(TextInputStyle.Paragraph)
    .setValue(template)
    .setRequired(true);

  const payoutsRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    payoutsInput,
  );

  modal.addComponents(payoutsRow);

  await interaction.showModal(modal);
}

export async function HandleSettleCompetitionModal(
  interaction: ModalSubmitInteraction,
) {
  const customId = interaction.customId;
  if (!customId.startsWith(MODAL_CUSTOM_ID_PREFIX)) {
    return;
  }

  const competitionId = parseInt(
    customId.replace(MODAL_CUSTOM_ID_PREFIX, ""),
    10,
  );

  if (Number.isNaN(competitionId)) {
    await interaction.reply({
      content: "Invalid competition ID.",
      ephemeral: true,
    });
    return;
  }

  const competition = getCompetition(competitionId);
  if (!competition) {
    await interaction.reply({
      content: `Competition ${competitionId} not found.`,
      ephemeral: true,
    });
    return;
  }

  if (competition.isSettled) {
    await interaction.reply({
      content: `Competition ${competitionId} has already been settled.`,
      ephemeral: true,
    });
    return;
  }

  const entries = getCompetitionEntriesByCompetition(competitionId);
  const rawPayouts = interaction.fields.getTextInputValue(MODAL_FIELD_PAYOUTS);

  try {
    const awards = parsePayoutLines(rawPayouts, entries);
    const results = settleCompetition(competitionId, awards);
    results.sort((a, b) => b[1] - a[1]);
    const resultsMessage = buildSettleResultsMessage(
      competitionId,
      null,
      results,
      competition.description,
      "Competition",
      true,
    );
    await interaction.reply({
      content: resultsMessage,
    });
  } catch (err: any) {
    console.error("Error settling competition:", err);
    await interaction.reply({
      content:
        err?.message ||
        "Failed to settle competition. Please check the payout format and try again.",
      ephemeral: true,
    });
  }
}

function entriesToTemplate(entries: CompetitionEntry[]): string {
  return entries
    .map((entry) => {
      const fiend = getFiend(entry.userId);
      return `${fiend?.name ?? entry.userId} 0`;
    })
    .join("\n");
}

function parsePayoutLines(
  rawText: string,
  entries: CompetitionEntry[],
): Array<{ userId: string; amount: number }> {
  const userMap = new Map<string, string>();
  for (const entry of entries) {
    const fiend = getFiend(entry.userId);
    if (fiend?.name) {
      userMap.set(fiend.name.toLowerCase(), entry.userId);
    }
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    throw new Error("Please provide at least one payout line.");
  }

  const awards: Array<{ userId: string; amount: number }> = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const mentionMatch = line.match(/(?:.*\s)?<@!?(\d+)>\s+(-?\d+(?:\.\d+)?)$/);
    const idMatch = line.match(/(?:.*\s)?(\d+)\s+(-?\d+(?:\.\d+)?)$/);
    let userId: string | undefined;
    let amountString: string | undefined;

    if (mentionMatch) {
      userId = mentionMatch[1];
      amountString = mentionMatch[2];
    } else if (idMatch) {
      const maybeId = idMatch[1];
      const maybeAmount = idMatch[2];
      if (userMap.has(maybeId.toLowerCase())) {
        userId = userMap.get(maybeId.toLowerCase());
      } else {
        userId = maybeId;
      }
      amountString = maybeAmount;
    } else {
      const parts = line.split(/\s+/);
      const amountToken = parts.pop();
      const name = parts.join(" ");
      if (!amountToken || !name) {
        throw new Error(
          `Invalid line format: "${line}". Use username or mention followed by an amount.`,
        );
      }
      userId = userMap.get(name.toLowerCase());
      amountString = amountToken;
    }

    if (!userId || !amountString) {
      throw new Error(
        `Invalid line format: "${line}". Use username or mention followed by an amount.`,
      );
    }

    const amount = parseFloat(amountString);
    if (Number.isNaN(amount)) {
      throw new Error(`Invalid amount for line: "${line}".`);
    }

    if (seen.has(userId)) {
      throw new Error(`Duplicate payout entry for user ${userId}.`);
    }

    seen.add(userId);
    awards.push({ userId, amount });
  }

  return awards;
}
