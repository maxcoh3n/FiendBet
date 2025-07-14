import { ChatInputCommandInteraction } from "discord.js";
import { getFiend, createFiend } from "../database/dbController";
import { STARTING_BALANCE } from "../common/constants";
import { getServerNickname } from "../common/util";

export default async function HandleBalance(
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user", true);
  const fiend = getFiend(user.id);

  if (!fiend) {
    const name = await getServerNickname(user, interaction);
    createFiend(user.id, name);
    await interaction.reply(
      `New Fiend Created for ${name} with ${STARTING_BALANCE} FiendBucks!`,
    );
    return;
  }

  await interaction.reply(
    `${fiend.name} has ${fiend.balance} FiendBucks, and ${fiend.credit || 0} on credit!`,
  );
}
