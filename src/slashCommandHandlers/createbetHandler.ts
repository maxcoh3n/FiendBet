import { ChatInputCommandInteraction } from "discord.js";
import { createBet } from "../dbconnection";
import { BetTypes } from "../types";
import { betToString } from "../util";
import { BetCreationTips, NewBetMessage } from "../strings";

export default async function HandleCreateBet(
  interaction: ChatInputCommandInteraction,
) {
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand !== "moneyline" && subcommand !== "spread") {
    await interaction.reply("Invalid subcommand. Use 'moneyline' or 'spread'.");
    return;
  }

  switch (subcommand) {
    case "moneyline":
      await handleMoneylineBet(interaction);
      break;
    case "spread":
      await handleSpreadBet(interaction);
      break;
    default:
      await interaction.reply("Unknown subcommand.");
  }
}

async function handleMoneylineBet(interaction: ChatInputCommandInteraction) {
  const description = interaction.options.getString("description", true);
  let line = interaction.options.getInteger("line");

  // Validate input
  if (!description || line === undefined) {
    await interaction.reply(
      "Please provide a valid description and moneyline.",
    );
    return;
  }

  if (!line) {
    line = 100;
  }

  // Create the bet in the database
  const bet = await createBet(description, BetTypes.MONEYLINE, line);

  if (bet) {
    await interaction.reply(
      `${NewBetMessage}\n${betToString(bet)}\nTo place a wager, reply to this message \"Yes\" or \"No\" and the amount you want to wager.\n${BetCreationTips}`,
    );
  } else {
    await interaction.reply("Failed to create spread bet. Please try again.");
  }
}

async function handleSpreadBet(interaction: ChatInputCommandInteraction) {
  const description = interaction.options.getString("description", true);
  let spread = interaction.options.getNumber("spread", true);

  // Validate input
  if (!description || spread === undefined) {
    await interaction.reply("Please provide a valid description and spread.");
    return;
  }

  // Create the bet in the database
  const bet = await createBet(
    description,
    BetTypes.SPREAD,
    undefined, // this sucks, why isn't this cool like python
    spread,
  );

  if (bet) {
    await interaction.reply(
      `${NewBetMessage}\n${betToString(bet)}\nTo place a wager, reply to this message \"Over\" or \"Under\" and the amount you want to wager.\n${BetCreationTips}`,
    );
  } else {
    await interaction.reply("Failed to create spread bet. Please try again.");
  }
}
