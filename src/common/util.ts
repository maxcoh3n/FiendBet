import {
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  User,
} from "discord.js";
import { semanticNo, semanticYes } from "./constants";
import { Bet, BetTypes, FiendWager, Replyable, SpreadTypes } from "./types";

export function betToString(bet: Bet): string {
  return `${bet.description}\n${
    bet.type == BetTypes.MONEYLINE
      ? "**Moneyline:** " +
        (bet.moneyLine && bet.moneyLine > 0
          ? "+" + bet.moneyLine
          : bet.moneyLine)
      : ""
  }${
    bet.type == BetTypes.SPREAD
      ? "**Spread:** " +
        (bet.spread && bet.spread > 0 ? "+" + bet.spread : bet.spread)
      : ""
  } ${bet.isOpen ? "" : "Closed" + "|"} | **ID:** ${bet.id} `;
}

export function fiendWagerToString(fiendWager: FiendWager): string {
  return `${fiendWager.name} wagered **${fiendWager.amount}** on ${
    fiendWager.choice
  } `;
}

export function getPayout(
  wagerAmount: number,
  choice: boolean | SpreadTypes,
  isBetWon: boolean,
  type: BetTypes,
  moneyLine: number = 0,
): number {
  if (!isBetWon) {
    return -wagerAmount;
  }
  if (type === BetTypes.MONEYLINE) {
    if (choice == true) {
      return (
        wagerAmount * (moneyLine > 0 ? moneyLine / 100 : 100 / (-1 * moneyLine))
      );
    }
    if (choice == false) {
      return (
        wagerAmount * (moneyLine < 0 ? (-1 * moneyLine) / 100 : 100 / moneyLine)
      );
    }
  } else if (type === BetTypes.SPREAD) {
    return wagerAmount;
  }
  return 0; // Default case, no payout
}

export function getBetId(messageContent: string): number | false {
  const betIdMatch = messageContent.match(/\*\*ID:\*\*\s*(-?\d+(\.\d+)?)/);
  if (betIdMatch) {
    return Number(betIdMatch[1]);
  }
  return false;
}

export function getNumberFromMessage(messageContent: string): number | false {
  const numbers = messageContent.match(/-?\d+(\.\d+)?/g);
  if (numbers && numbers.length == 1) {
    return Number(numbers[0]);
  }
  return false;
}

export function pingFiend(userId: string): string {
  return `<@${userId}>`;
}

export async function getServerNickname(
  user: User,
  interaction: ChatInputCommandInteraction,
): Promise<string> {
  const member = await interaction.guild?.members.fetch(user.id);

  return member?.nickname || user.displayName;
}

export async function getServerNicknameWithMessage(
  user: User,
  message: Message,
): Promise<string> {
  const member = await message.guild?.members.fetch(message.author.id);
  return member?.nickname ?? message.author.displayName;
}

export function doesStringContainYes(s: string) {
  return semanticYes.some((yes) => s.toLowerCase().includes(yes));
}

export function doesStringContainNo(s: string) {
  return semanticNo.some((no) => s.toLowerCase().includes(no));
}

export async function sendMessageEphemeral(
  interaction: Replyable,
  message: string,
) {
  if (interaction instanceof ChatInputCommandInteraction) {
    await interaction.reply({
      content: `${message}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply(message);
}
