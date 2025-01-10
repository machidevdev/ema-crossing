# Crypto EMA Crossing Bot

A Telegram bot that monitors EMA (Exponential Moving Average) crossings for cryptocurrency pairs and sends notifications when significant events occur.

## Features

- 🔄 Monitors EMA60 and EMA223 crossings for multiple timeframes (5m, 1h, 4h)
- 📊 Tracks multiple cryptocurrency pairs (SOL/USDT, ETH/USDT, BTC/USDT)
- ⚠️ Sends alerts when EMAs are converging (within 0.1% of crossing)
- 🚨 Notifies subscribers of bullish and bearish crossings
- 📱 Telegram commands for easy interaction

## Commands

- `/start` - Start the bot
- `/subscribe` - Subscribe to crossing notifications
- `/status` - Check bot status
- `/crossings <symbol>` - Show last 10 EMA crossings for a symbol
- `/help` - Show available commands

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```env
BOT_TOKEN=<your-telegram-bot-token>
DATABASE_URL=<your-database-url>
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=telegram_bot
DATABASE_URL="postgresql://postgres:your_password_here@postgres:5432/telegram_bot?schema=public"
```

4. Start the services:

```bash
docker compose up --build
```

## Technology Stack

- Node.js with TypeScript
- Telegraf for Telegram bot functionality
- Prisma for database management
- PostgreSQL for data storage
- Docker for containerization
- TaAPI for cryptocurrency data

## Development

To run in development mode:

```bash
npm run dev
```

This will start the bot and connect to the database. I would avoid using it this way since it is quite buggy
