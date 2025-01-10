import { bot } from './services/bot';
import { startPriceTracking } from './services/cron';
import * as dotenv from 'dotenv';

dotenv.config();

// Start the bot
bot.launch();
startPriceTracking();

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
}); 