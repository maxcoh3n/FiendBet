# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `yarn build` - Compiles TypeScript to JavaScript in the `/build/` directory
- `yarn dev` - Runs the compiled bot from `/build/index.js`
- `npx ts-node src/index.ts` - Run TypeScript directly without building (for testing)

### Code Quality
- No lint command currently configured. Consider running ESLint directly: `npx eslint src/`
- No type checking command configured. Run TypeScript compiler in check mode: `npx tsc --noEmit`
- No test command configured (package.json test script exits with error)

## Architecture Overview

### Core Components

1. **Bot Entry Point** (`src/index.ts`)
   - Initializes Discord client with necessary intents
   - Loads environment variables (TOKEN, CLIENT_ID)
   - Registers slash commands on startup
   - Routes interactions to appropriate handlers

2. **Database Layer** (`src/database/`)
   - **db.ts**: Initializes SQLite database, runs migrations from `/db_migrations/`
   - **dbController.ts**: Main interface for all database operations
   - **dbStatements.ts**: Prepared SQL statements for performance
   - **models.ts**: TypeScript interfaces matching database schema
   - Uses better-sqlite3 for synchronous database operations

3. **Command System**
   - **commands.ts**: Defines all slash commands using Discord.js builders
   - **slashCommandHandlers/**: Individual handlers for each command
   - Commands: `/createbet`, `/bets`, `/balance`, `/award`, `/leaderboard`, `/settle`, `/help`

4. **Betting System**
   - Supports two bet types: moneyline (yes/no) and spread (over/under)
   - Users reply to bet messages to place wagers
   - Ephemeral messages used for sensitive interactions
   - Automatic balance tracking and credit system

### Database Schema

- **fiends**: Users with balance, credit, and bankruptcy tracking
- **bets**: Bet definitions with type, description, line/spread, status
- **wagers**: Individual user bets linking fiends to bets
- **awards**: History of FiendBucks awarded to users
- **migrations**: Tracks applied database migrations

### Key Patterns

1. **Error Handling**: Most handlers wrap operations in try-catch blocks and send user-friendly error messages
2. **Ephemeral Messages**: Used for sensitive operations like balance checks and bet placement
3. **Database Transactions**: Not explicitly used - consider implementing for multi-table operations
4. **Type Safety**: Extensive use of TypeScript interfaces for database rows and Discord interactions

## Environment Setup

Required environment variables in `.env`:
```
TOKEN=<Discord bot token>
CLIENT_ID=<Discord application client ID>
```

## Common Development Tasks

- To add a new slash command: Add definition in `commands.ts`, create handler in `slashCommandHandlers/`, register in `index.ts`
- To modify database schema: Create new migration file in `/db_migrations/` with incremental number
- Database file location: `fiendBets.db` in project root