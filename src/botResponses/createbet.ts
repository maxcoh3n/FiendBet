import { ChatInputCommandInteraction } from "discord.js";
import { createBet } from "../dbconnection";
import { BetTypes } from "../types";

export default async function createBetResponse(
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
  const betId = await createBet(description, BetTypes.MONEYLINE, line);

  if (betId) {
    await interaction.reply(`Moneyline bet created successfully! ID: ${betId}`);
  } else {
    await interaction.reply(
      "Failed to create moneyline bet. Please try again.",
    );
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
  const betId = await createBet(
    description,
    BetTypes.SPREAD,
    undefined, // this sucks, why isn't this cool like python
    spread,
  );

  if (betId) {
    await interaction.reply(`Spread bet created successfully! ID: ${betId}`);
  } else {
    await interaction.reply("Failed to create spread bet. Please try again.");
  }
}
