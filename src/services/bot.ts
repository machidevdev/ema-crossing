import { Telegraf } from 'telegraf';
import prisma from './prisma';
import fs from 'fs';
import path from 'path';
import { generateCrossingChart } from './chart';

const SUBSCRIBERS_FILE = path.join(__dirname, '../../data/subscribers.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load subscribers
let subscribers: string[] = [];
try {
  if (fs.existsSync(SUBSCRIBERS_FILE)) {
    subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8'));
  }
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers));
} catch (error) {
  console.error('Error loading subscribers:', error);
}

// Add these functions
export const getSubscribers = () => subscribers;

export const addSubscriber = (chatId: string) => {
  if (!subscribers.includes(chatId)) {
    subscribers.push(chatId);
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers));
  }
};

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(process.env.BOT_TOKEN);

// Add bot commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome! I will notify you about EMA crossings.');
  process.env.NOTIFICATION_CHAT_ID = ctx.chat.id.toString();
});

bot.command('status', (ctx) => {
  ctx.reply('I am monitoring EMA crossings for SOL/USDT and ETH/USDT');
});

bot.command('crossings', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length !== 2) {
    return ctx.reply('Usage: /crossings <symbol>\nExample: /crossings SOL');
  }

  const symbol = args[1].toUpperCase();
  
  try {
    const token = await prisma.token.findUnique({
      where: { symbol },
      include: {
        crosses: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          include: {
            ema1: true,
            ema2: true
          }
        }
      }
    });

    if (!token) {
      return ctx.reply(`No data found for ${symbol}. Available symbols: SOL, ETH`);
    }

    if (token.crosses.length === 0) {
      return ctx.reply(`No crossings found for ${symbol}`);
    }

    const message = [`*Last 10 EMA Crossings for ${symbol}*\n`];

    for (const cross of token.crosses) {
      const emoji = cross.crossType === 'BULLISH' ? '🟢' : '🔴';
      const date = new Date(cross.timestamp).toLocaleString();
      message.push(
        `${emoji} ${cross.timeframe} - ${cross.crossType}\n` +
        `Time: ${date}\n` +
        `EMA60: ${cross.ema1.value.toFixed(2)}\n` +
        `EMA223: ${cross.ema2.value.toFixed(2)}\n`
      );
    }

    await ctx.reply(message.join('\n'), { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error fetching crossings:', error);
    ctx.reply('Error fetching crossing data. Please try again later.');
  }
});

bot.command('help', (ctx) => {
  const help = `
*Available Commands*

/start - Start the bot
/subscribe - Subscribe to crossing notifications
/status - Check bot status
/crossings <symbol> - Show last 10 EMA crossings for a symbol
/chart <symbol> <timeframe> - Get price chart with EMAs
/help - Show this help message

*Supported Symbols*
- SOL
- ETH
- BTC

*Timeframes*
- 5m
- 1h
- 4h
`;
  ctx.reply(help, { parse_mode: 'Markdown' });
});

// Add this command
bot.command('subscribe', (ctx) => {
  const chatId = ctx.chat.id.toString();
  addSubscriber(chatId);
  ctx.reply('✅ You are now subscribed to EMA crossing notifications!');
});

// Add with other commands
bot.command('chart', async (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length !== 3) {
    return ctx.reply('Usage: /chart <symbol> <timeframe>\nExample: /chart SOL 4h');
  }

  const [_, symbol, timeframe] = args;
  const validTimeframes = ['5m', '1h', '4h'];
  
  if (!validTimeframes.includes(timeframe)) {
    return ctx.reply(`Invalid timeframe. Please use: ${validTimeframes.join(', ')}`);
  }

  try {
    const chartBuffer = await generateCrossingChart(symbol.toUpperCase(), timeframe);
    await ctx.replyWithPhoto(
      { source: chartBuffer },
      { caption: `${symbol.toUpperCase()} ${timeframe} Chart` }
    );
  } catch (error) {
    console.error('Error generating chart:', error);
    ctx.reply('Error generating chart. Please try again later.');
  }
}); 