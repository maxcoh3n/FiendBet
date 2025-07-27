import { BetTypes, Bet, SpreadTypes, Replyable } from "../common/types";
import {
  sendMessageEphemeral,
  getNumberFromMessage,
  doesStringContainNo,
  doesStringContainYes,
} from "../common/util";

export async function handleSettleHelper(
  replyable: Replyable,
  bet: Bet,
  resultRaw: string,
) {
  if (bet.isSettled) {
    sendMessageEphemeral(
      replyable,
      `Sorry, Bet ${bet.id} has already been settled.`,
    );
    return;
  }

  let betResult = null;

  switch (bet.type) {
    case BetTypes.MONEYLINE: {
      if (doesStringContainYes(resultRaw)) {
        betResult = true;
      } else if (doesStringContainNo(resultRaw)) {
        betResult = false;
      } else {
        sendMessageEphemeral(
          replyable,
          "Sorry, Moneyline bets result must be Yes/No",
        );
        return;
      }
      break;
    }
    case BetTypes.SPREAD: {
      if (
        resultRaw
          .toUpperCase()
          .includes(SpreadTypes.OVER.toString().toUpperCase())
      ) {
        betResult = SpreadTypes.OVER;
        break;
      }
      if (
        resultRaw
          .toUpperCase()
          .includes(SpreadTypes.UNDER.toString().toUpperCase())
      ) {
        betResult = SpreadTypes.UNDER;
        break;
      }
      const betResultValue = getNumberFromMessage(resultRaw);
      if (betResultValue) {
        if (!bet.spread) {
          throw new Error(
            "This shouldn't be possible, but I screwed up by making spreads and moneylines the same type",
          );
        }
        betResult =
          betResultValue > bet.spread ? SpreadTypes.OVER : SpreadTypes.UNDER;
        break;
      }

      await replyable.reply(
        "Please reply with **settle** 'Over', 'Under' or the final exact count to settle the bet, ",
      );
      return;

      break;
    }
  }

  const fiendsresults = settleBet(bet.id, betResult);
  const resultsMessage = fiendsresults
    .map(
      ([fiend, profit]) =>
        `${pingFiend(fiend.id)} ${profit > 0 ? "gained" : "lost"} ${profit} FiendBucks From this wager, and now has ${fiend.balance}`,
    )
    .join("\n");

  await message.reply(
    `Bet ID ${bet.id} has been settled with result: ${bet.result}.\nResults:\n${resultsMessage}`,
  );
}
