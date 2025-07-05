// Import the Discord.js module
require("dotenv").config();

const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const { commands } = require("./commands.js");
const { setFiendBucks, getFiendBucks } = require("./dbconnection.js");

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
async function registerCommands() {
  try {
    console.log("Started refreshing application (/) commands.");

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

// When the client is ready, run this code
client.once("ready", () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  registerCommands();
});

// Listen for slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  console.log(`Received command: ${commandName} from ${interaction.user.tag}`);

  try {
    switch (commandName) {
      case "hello":
        await interaction.reply("Hello World! 🌍");
        break;

      case "balance": {
        const user = interaction.options.getUser("user");
        const amount = getFiendBucks(user.id);
        await interaction.reply(`${user} has ${amount} FiendBucks!`);
        break;
      }

      case "bankrupt": {
        const user = interaction.options.getUser("user");
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

  // Check if the message is a reply
  if (message.reference) {
    try {
      const repliedMessage = await message.channel.messages.fetch(
        message.reference.messageId,
      );

      console.log(repliedMessage.content);

      // Check if the original message was sent by the bot itself
      if (repliedMessage.author.id === client.user.id) {
        await message.reply(
          "Thanks for the reply!, " + repliedMessage.author.username,
        );
      }
    } catch (error) {
      console.error("Failed to fetch replied message:", error);
    }
  }
});

// Handle errors
client.on("error", console.error);

// Log in to Discord with your app's token
client.login(process.env.TOKEN);
