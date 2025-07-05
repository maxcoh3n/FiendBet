// Define slash commands
import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Replies with Hello World!"),
  new SlashCommandBuilder()
    .setName("bankrupt")
    .setDescription("resets user's balance to 100 FiendBucks")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to reset")
        .setRequired(true),
    ),
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
    .setName("placebet")
    .setDescription("Place a sports bet")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("moneyline")
        .setDescription("Place a moneyline bet")
        .addStringOption((option) =>
          option.setName("team").setDescription("Team name").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("line")
            .setDescription("Moneyline (e.g., +150, -200)")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Bet amount")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("overunder")
        .setDescription("Place an over/under bet")
        .addStringOption((option) =>
          option.setName("team").setDescription("Team name").setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("total")
            .setDescription("Point total (e.g., 5.5)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("pick")
            .setDescription("Over or Under")
            .addChoices(
              { name: "Over", value: "over" },
              { name: "Under", value: "under" },
            )
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("amount")
            .setDescription("Bet amount")
            .setRequired(true),
        ),
    ),
].map((command) => command.toJSON());
