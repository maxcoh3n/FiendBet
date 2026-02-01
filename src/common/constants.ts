export const NewBetMessage = "New bet created!";
export const UnsettledBetsMsg = "Unsettled Bets";
export const SecretBetMessage = "Secret bet";
export const semanticYes = ["yes", "y", "yea", "yeah", "yep", "true"];
export const semanticNo = ["no", "n", "nah", "nope", "false"];
export const STARTING_BALANCE = 100;
export const AllBetsHelpMessage = `Reply to the all bets message (not this one) in the following format:
Action BetID Choices/Amount ex:
To wager 5 FiendBucks on bet 1, reply
\`wager 1 yes 5\`
To settle bet 2, reply
\`settle 2 over\``;
export const AllBetsFooterMessage = `\nReply to this message with "help" to learn how to interact with these bets individually.`;
export const helpMessage = `To create a bet, use the /createbet command.
 Bets can either be moneyline or spread.
 A moneyline bet by default has a 50% chance of being yes or no, represented as +100 odds. 
 If the yes outcome is less likely, the odds should be over 100, and if the no outcome is more likely, the odds will be under -100. 
 +200 means 1:2 odds or a 1 in 3 chance of occurring, -200 means 2:1 odds or a 2 in 3 chance of occurring.
 A spread bet measures some countable number, with the spread being the value you need to decide will go over or under. It should end in .5 to avoid null results.
 To wager on a bet, reply to the bet creation message with **wager** followed by your choice and the amount you want to wager.
 To close a bet to new wagers, reply to the bet creation message with **close**.
 To settle a bet, reply to the bet creation message with **settle** followed by the result of the bet. Either Yes/No for a moneyline bet, or Over/Under (or the actual value) for a spread bet.
 Balance and leaderboard, and bets should be self explanatory.`;
