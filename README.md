# FiendBets Bot

This bot keeps track of bets for friends (fiends)

## Setup

- Download the repo
- `cp .env.example .env` and fill in accordingly.
- `yarn dev` to test FiendBet

## DB interaction

- sqlite3 fiendbets.db
- .tables
- .schema <table_name>

## Usage

```
/createbet moneyline description: Shai cries line: +200
```

reply: yes 100.

```
/createbet moneyline description: Jdub cries line: -200
```

reply: no 75.

```
/createbet spread desc: Haliburton achilles showings spread: 5.5
```

reply: over 100
