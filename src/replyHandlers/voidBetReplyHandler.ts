import { Message } from "discord.js";
import { Bet } from "../common/types";
import { voidBet } from "../database/dbController";

export async function voidBetReplyHandler(
  message: Message,
  repliedMessage: Message,
  bet: Bet,
  messageParts?: string[],
) {
  if (bet.isSettled) {
    await message.reply("This bet has already been settled.");
    return;
  }

  bet.isOpen = false;
  bet.isSettled = true;
  voidBet(bet.id);

  await message.reply(
    `Bet ID ${bet.id} has been voided. All wagers have been uncredited.`,
  );
}
