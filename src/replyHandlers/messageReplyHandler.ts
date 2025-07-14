import { NewBetMessage } from "../common/constants";
import { Message } from "discord.js";
import handleNewBetReply from "./newBetReplyHandler";

export default async function handleMessageReply(
  message: Message,
  repliedMessage: Message,
) {
  if (repliedMessage.content.includes(NewBetMessage)) {
    handleNewBetReply(message, repliedMessage);
  }
}
