// Import the Discord.js module
import * as dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { commands } from "./commands";
import HandleLeaderboard from "./slashCommandHandlers/leaderboardHandler";
import HandleBalance from "./slashCommandHandlers/balanceHandler";
import HandleCreateBet from "./slashCommandHandlers/createbetHandler";
import HandleBets from "./slashCommandHandlers/betsHandler";
import handleMessageReply from "./replyHandlers/messageReplyHandler";
import HandleHelp from "./slashCommandHandlers/helpHandler";

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
});

// Register slash commands
async function registerCommands(): Promise<void> {
  try {
    console.log("Started refreshing application (/) commands.");

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

// When the client is ready, run this code
client.once("ready", () => {
  console.log(`Ready! Logged in as ${client.user!.tag}`);
  registerCommands();
});

// Listen for slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  console.log(`Received command: ${commandName} from ${interaction.user.tag}`);

  try {
    switch (commandName) {
      case "help":
        await HandleHelp(interaction);
        break;

      case "leaderboard": {
        await HandleLeaderboard(interaction);
        break;
      }

      case "balance": {
        await HandleBalance(interaction);
        break;
      }

      case "createbet": {
        await HandleCreateBet(interaction);
        break;
      }

      case "bets": {
        await HandleBets(interaction);
        break;
      }

      default:
        await interaction.reply("Unknown command!");
    }
  } catch (error) {
    console.error("Error handling interaction:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if this message is a reply and has a messageId
  if (message.reference?.messageId) {
    try {
      // Fetch the original message being replied to
      const repliedMessage = await message.channel.messages.fetch(
        message.reference.messageId,
      );

      // Check if the original message was from our bot
      if (repliedMessage.author.id === client.user?.id) {
        await handleMessageReply(message, repliedMessage);
      }
    } catch (error) {
      console.error("Error fetching replied message:", error);
    }
  }
});

// Handle errors
client.on("error", console.error);

// Log in to Discord with your app's token
client.login(process.env.TOKEN);
