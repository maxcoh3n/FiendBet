import { ChatInputCommandInteraction } from "discord.js";
import { NewBetMessage, SecretBetMessage } from "../common/constants";
import { BetTypes } from "../common/types";
import { betToString, sendMessageEphemeral } from "../common/util";
import { createBet } from "../database/dbController";

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
  let description = interaction.options.getString("description", false);
  const secretDescription = interaction.options.getString(
    "secret_description",
    false,
  );

  let line = interaction.options.getInteger("line");

  // Validate input
  if (!description && !secretDescription) {
    await sendMessageEphemeral(
      interaction,
      "Please provide a valid description or secret description.",
    );
    return;
  }

  if (!line) {
    line = 100;
  }

  if (!description) {
    description = SecretBetMessage;
  }

  // Create the bet in the database
  const bet = await createBet(
    description,
    secretDescription,
    BetTypes.MONEYLINE,
    line,
  );

  if (bet) {
    await interaction.reply(
      `${NewBetMessage}\n${betToString(bet)}\nTo place a wager, reply to this message **wager** \"Yes\" or \"No\" and the amount you want to wager.\n`,
    );
  } else {
    await sendMessageEphemeral(
      interaction,
      "Failed to create spread bet. Please try again.",
    );
  }
}

async function handleSpreadBet(interaction: ChatInputCommandInteraction) {
  let description = interaction.options.getString("description", false);
  const secretDescription = interaction.options.getString(
    "secret_description",
    false,
  );
  let spread = interaction.options.getNumber("spread", true);

  // Validate input
  if ((!description && !secretDescription) || spread === undefined) {
    await sendMessageEphemeral(
      interaction,
      "Please provide a valid description or secret description, and spread.",
    );
    return;
  }

  if (!description) {
    description = SecretBetMessage;
  }

  // Create the bet in the database
  const bet = await createBet(
    description,
    secretDescription,
    BetTypes.SPREAD,
    undefined, // this sucks, why isn't this cool like python
    spread,
  );

  if (bet) {
    await interaction.reply(
      `${NewBetMessage}\n${betToString(bet)}\nTo place a wager, reply to this message **wager** \"Over\" or \"Under\" and the amount you want to wager.`,
    );
  } else {
    await sendMessageEphemeral(
      interaction,
      "Failed to create spread bet. Please try again.",
    );
  }
}
