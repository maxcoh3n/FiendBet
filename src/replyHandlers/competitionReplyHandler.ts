import { Message } from "discord.js";
import { STARTING_BALANCE } from "../common/constants";
import { getServerNicknameWithMessage } from "../common/util";
import {
  awardCompetitionWinner,
  createCompetitionEntry,
  createCompetitionEntryWithCustomFee,
  createFiend,
  getCompetition,
  getFiend,
  hasCompetitionEntry,
  reenterCompetitionEntry,
} from "../database/dbController";

export default async function handleCompetitionReply(
  message: Message,
  repliedMessage: Message,
) {
  const content = message.content.toLowerCase();

  if (!repliedMessage.content.includes("New competition created!")) return;

  if (content.match(/\bsettle\b/)) {
    await message.reply(
      "Please use the /settlecompetition command to settle the competition.",
    );
    return;
  }

  // Only accept simple "enter" replies
  // If announcing a winner: "winner @user"
  if (content.includes("winner")) {
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
      await message.reply(
        'Please tag the winning user. Example: "winner @user"',
      );
      return;
    }

    const matchW = repliedMessage.content.match(/\*\*ID:\*\*\s*(\d+)/);
    const competitionIdW = matchW ? parseInt(matchW[1], 10) : null;
    if (!competitionIdW) {
      await message.reply("Could not find competition id in the message.");
      return;
    }

    try {
      const res = awardCompetitionWinner(competitionIdW, mentioned.id);
      await message.reply(
        `<@${mentioned.id}> won and now has ${res.balance} fiendbucks.`,
      );
    } catch (err) {
      console.error("Error awarding competition winner:", err);
      await message.reply(
        "Failed to award competition winner. Please try again.",
      );
    }

    return;
  }

  const match = repliedMessage.content.match(/\*\*ID:\*\*\s*(\d+)/);
  const competitionId = match ? parseInt(match[1], 10) : null;

  if (!competitionId) {
    await message.reply("Could not find competition id in the message.");
    return;
  }

  const competition = getCompetition(competitionId);
  if (!competition) {
    await message.reply(`Competition ${competitionId} not found.`);
    return;
  }

  const reenterMatch = content.match(/\breenter\b(?:\s+(-?\d+))?/i);
  const isReenter = Boolean(reenterMatch);
  const reenterAmount =
    reenterMatch && reenterMatch[1] ? parseInt(reenterMatch[1], 10) : null;

  if (!content.includes("enter") && !isReenter) {
    await message.reply(
      'To enter a competition, reply with "enter" to the competition message.',
    );
    return;
  }

  if (!competitionId) {
    await message.reply("Could not find competition id in the message.");
    return;
  }

  try {
    // Ensure user exists
    let fiend = getFiend(message.author.id);
    if (!fiend) {
      fiend = createFiend(
        message.author.id,
        await getServerNicknameWithMessage(message.author, message),
      );
      await message.reply(
        `New Fiend Created for ${fiend.name} with ${STARTING_BALANCE} FiendBucks!`,
      );
    }

    if (isReenter) {
      const chargeAmount = reenterAmount ?? competition.entryFee;
      if (chargeAmount <= 0) {
        await message.reply(
          "Please provide a valid positive amount to reenter.",
        );
        return;
      }

      if (!hasCompetitionEntry(message.author.id, competitionId)) {
        try {
          if (reenterAmount === null) {
            createCompetitionEntry(message.author.id, competitionId);
          } else {
            createCompetitionEntryWithCustomFee(
              message.author.id,
              competitionId,
              chargeAmount,
            );
          }
          await message.react("✅");
          return;
        } catch (err: any) {
          if (err.message && err.message.includes("Insufficient funds")) {
            await message.react("🚫");
            return;
          }
          if (err.message && err.message.includes("Competition closed")) {
            await message.react("❌");
            return;
          }
          throw err;
        }
      }

      try {
        reenterCompetitionEntry(message.author.id, competitionId, chargeAmount);
        await message.react("🔁");
        return;
      } catch (err: any) {
        if (err.message && err.message.includes("Insufficient funds")) {
          await message.react("🚫");
          return;
        }
        console.error("Error processing reentry:", err);
        await message.reply(
          "Failed to reenter competition. Please try again later.",
        );
        return;
      }
    }

    if (hasCompetitionEntry(message.author.id, competitionId)) {
      await message.react("😑");
      return;
    }
    try {
      createCompetitionEntry(message.author.id, competitionId);
      await message.react("✅");
    } catch (err: any) {
      if (err.message && err.message.includes("Insufficient funds")) {
        await message.react("🚫");
        return;
      }

      if (err.message && err.message.includes("Competition closed")) {
        await message.react("❌");
        return;
      }
      throw err;
    }
  } catch (err) {
    console.error("Error creating competition entry:", err);
    await message.reply("Failed to enter competition. Please try again later.");
  }
}
