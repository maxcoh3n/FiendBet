// Define slash commands
import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("view commands and instructions"),
  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("view all users FiendBucks balances"),
  new SlashCommandBuilder()
    .setName("bets")
    .setDescription("view all unsettled bets"),
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("view user's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to view balance for")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("settle")
    .setDescription("settle a bet")
    .addIntegerOption((option) =>
      option
        .setName("bet_id")
        .setDescription("The Id of the bet to settle")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("result")
        .setDescription("The result of the bet (True/False, Over/Under)")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("award")
    .setDescription("award a user some FiendBucks")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to award")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of FiendBucks to award")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the award")
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("createbet")
    .setDescription("Create a new bet")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("moneyline")
        .setDescription("Create a bet that can resolve to true or false")
        .addStringOption((option) =>
          option.setName("description").setDescription("Describes the bet"),
        )
        .addStringOption((option) =>
          option
            .setName("secret_description")
            .setDescription(
              "Describes the bet but will only be revealed upon settlement",
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("line")
            .setDescription(
              "Moneyline (leave blank for even odds. -200 means 2:1 odds, +200 means 1:2 odds)",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("spread")
        .setDescription(
          "Create a bet that can resolve to some number over or under a spread",
        )
        .addNumberOption((option) =>
          option
            .setName("spread")
            .setDescription("The spread, i.e. over/under (e.g., 5.5)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("description").setDescription("What is the bet"),
        )
        .addStringOption((option) =>
          option
            .setName("secret_description")
            .setDescription(
              "Describes the bet but will only be revealed upon settlement",
            ),
        ),
    ),
].map((command) => command.toJSON());
