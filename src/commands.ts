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
    .setName("createbet")
    .setDescription("Create a new bet")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("moneyline")
        .setDescription("Create a bet that can resolve to true or false")
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("What is the bet")
            .setRequired(true),
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
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("What is the bet")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("spread")
            .setDescription("The spread, i.e. over/under (e.g., 5.5)")
            .setRequired(true),
        ),
    ),
].map((command) => command.toJSON());
