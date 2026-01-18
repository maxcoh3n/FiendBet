import { Message } from "discord.js";
import { Fiend } from "../common/types";
import { closeAllBets } from "../database/dbController";

export default async function handleAllBetsReply(
  message: Message,
  repliedMessage: Message,
  fiend: Fiend,
) {
  const messageContentLower = message.content.toLowerCase();

  if (
    messageContentLower.includes("close") ||
    messageContentLower.includes("lock")
  ) {
    await closeBetsReplyHandler(message);
    return;
  }
}

async function closeBetsReplyHandler(message: Message) {
  await closeAllBets();
  await message.react("🔒");
}
