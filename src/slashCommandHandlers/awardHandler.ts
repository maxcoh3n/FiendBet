import { ChatInputCommandInteraction } from "discord.js";
import { getFiend, createFiend, awardFiend } from "../database/dbController";
import { STARTING_BALANCE } from "../common/constants";
import {
  getServerNickname,
  getServerNicknameWithMessage,
} from "../common/util";

export default async function HandleAward(
  interaction: ChatInputCommandInteraction,
) {
  const user = interaction.options.getUser("user", true);
  const messageSender = interaction.user;

  if (user.id === messageSender.id) {
    await interaction.reply("Nice try, you cannot award yourself.");
    return;
  }

  let fiend = getFiend(user.id);
  const amount = interaction.options.getInteger("amount", true);

  if (amount <= 0) {
    await interaction.reply(
      "Nice try, you must award a positive amount of FiendBucks.",
    );
    return;
  }

  const awardReason = interaction.options.getString("reason", false);

  if (!fiend) {
    fiend = createFiend(user.id, await getServerNickname(user, interaction));
    await interaction.reply(
      `New Fiend Created for ${fiend.name} with ${STARTING_BALANCE} FiendBucks!`,
    );
  }

  const updatedFiend = awardFiend(fiend.id, amount, awardReason || "");

  await interaction.followUp(
    `${fiend.name} was awarded with ${amount} FiendBucks ${awardReason ? "beacause " + awardReason : ""}. They now have ${updatedFiend.balance} FiendBucks!`,
  );
}
