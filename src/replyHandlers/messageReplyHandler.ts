import { Message } from "discord.js";
import {
  NewBetMessage,
  STARTING_BALANCE,
  UnsettledBetsMsg,
} from "../common/constants";
import { Fiend } from "../common/types";
import { getServerNicknameWithMessage } from "../common/util";
import { createFiend, getFiend } from "../database/dbController";
import handleAllBetsReply from "./allBetsReplyHandler";
import handleNewBetReply from "./newBetReplyHandler";

export default async function handleMessageReply(
  message: Message,
  repliedMessage: Message,
) {
  const fiend = await checkAndCreateNewFiend(message);

  if (repliedMessage.content.includes(NewBetMessage)) {
    return handleNewBetReply(message, repliedMessage, fiend);
  }
  if (repliedMessage.content.includes(UnsettledBetsMsg)) {
    return handleAllBetsReply(message, repliedMessage, fiend);
  }

  async function checkAndCreateNewFiend(message: Message): Promise<Fiend> {
    let fiend = getFiend(message.author.id);

    if (!fiend) {
      fiend = createFiend(
        message.author.id,
        await getServerNicknameWithMessage(message.author, message),
      );
      await message.reply(
        `New Fiend Created for ${fiend.name} with ${STARTING_BALANCE} FiendBucks!`,
      );
    }

    return fiend;
  }
}
