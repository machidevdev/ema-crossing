import { bot } from './services/bot';
import { startPriceTracking } from './services/cron';
import { initializeDatabase } from './services/initialize';
import * as dotenv from 'dotenv';

dotenv.config();

const start = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start the bot
    bot.launch();
    console.log('🤖 Bot started');
    
    // Start price tracking
    startPriceTracking();
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

start(); 