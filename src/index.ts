// Import the Discord.js module
import * as dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ChatInputCommandInteraction,
  Message,
} from "discord.js";
import { commands } from "./commands";
import { setFiendBucks, getFiendBucks, getAllUsers } from "./dbconnection";

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
        await interaction.reply("Hi, sorry this bot is still in development!");
        break;

      case "leaderboard": {
        const users = getAllUsers();
        if (users.length === 0) {
          await interaction.reply("No users found!");
          return;
        }

        // Sort users by balance in descending order
        users.sort((a, b) => b.balance - a.balance);

        // Create leaderboard message
        const leaderboard = users
          .map(
            (user, index) =>
              `${index + 1}. ${user.id} - ${user.balance} FiendBucks`,
          )
          .join("\n");

        await interaction.reply(`**Leaderboard:**\n${leaderboard}`);
        break;
      }

      case "balance": {
        const user = interaction.options.getUser("user", true);
        const amount = getFiendBucks(user.id);
        await interaction.reply(`${user} has ${amount} FiendBucks!`);
        break;
      }

      case "bankrupt": {
        const user = interaction.options.getUser("user", true);
        setFiendBucks(user.id, 100);
        await interaction.reply(`${user} has been reset to 100 FiendBucks!`);
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
        // This is a reply to our bot's message!
        await message.reply(
          `You replied to my message: "${repliedMessage.content}"`,
        );

        // You can also check the content of the original message
        if (repliedMessage.content.includes("Hello World")) {
          await message.reply("Thanks for replying to my hello message! 👋");
        }
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
