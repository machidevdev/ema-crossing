import cron from 'node-cron';
import prisma from './prisma';
import taapi from './taapi';
import { notifyCrossing } from './notifications';
import { bot, getSubscribers } from './bot';
const tokens = ["SOL/USDT", "ETH/USDT", "BTC/USDT"]

// Helper function to create delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CONVERGENCE_THRESHOLD = 0.1; // 0.1% difference between EMAs

// Add this function to check convergence
const checkConvergence = (ema60: number, ema223: number): boolean => {
  const percentDiff = Math.abs((ema60 - ema223) / ema223 * 100);
  return percentDiff <= CONVERGENCE_THRESHOLD;
};

const fetchEmas = async () => {
  console.log(`\n[${new Date().toISOString()}] 🔄 Starting price and EMA fetch cycle`);
  
  try {
    // Fetch prices
    taapi.resetBulkConstructs();
    tokens.forEach(token => taapi.addCalculation("price", token, "1m", "price"));
    const priceResults = await taapi.executeBulk();
    
    // Store prices
    for (let i = 0; i < tokens.length; i++) {
      const symbol = tokens[i].split('/')[0];
      const price = priceResults.price[i].value;
      
      await prisma.token.upsert({
        where: { symbol },
        create: {
          symbol,
          prices: { create: { price } }
        },
        update: {
          prices: { create: { price } }
        }
      });
    }

    // Process EMAs
    const timeframes = ["5m", "1h", "4h"];
    
    for (const token of tokens) {
      const symbol = token.split('/')[0];
      
      for (const timeframe of timeframes) {
        try {
          // Fetch EMA60
          taapi.resetBulkConstructs();
          taapi.addCalculation("ema", token, timeframe, "ema60", { optInTimePeriod: 60 });
          const ema60Results = await taapi.executeBulk();
          await delay(1000);

          // Fetch EMA223
          taapi.resetBulkConstructs();
          taapi.addCalculation("ema", token, timeframe, "ema223", { optInTimePeriod: 223 });
          const ema223Results = await taapi.executeBulk();

          const tokenRecord = await prisma.token.findUnique({ where: { symbol } });
          if (!tokenRecord) continue;

          // Store EMAs
          const storedEmas = await Promise.all([
            prisma.eMA.create({
              data: {
                tokenId: tokenRecord.id,
                period: 60,
                value: ema60Results.ema60.value,
                timeframe
              }
            }),
            prisma.eMA.create({
              data: {
                tokenId: tokenRecord.id,
                period: 223,
                value: ema223Results.ema223.value,
                timeframe
              }
            })
          ]);

          // Check for crossings
          const [ema60Record, ema223Record] = storedEmas;
          const isBullishNow = ema60Record.value > ema223Record.value;
          
          const lastCross = await prisma.eMACross.findFirst({
            where: { tokenId: tokenRecord.id, timeframe },
            orderBy: { timestamp: 'desc' }
          });

          // Add convergence check
          const isConverging = checkConvergence(ema60Record.value, ema223Record.value);
          if (isConverging) {
            const trend = ema60Record.value > ema223Record.value ? "bullish" : "bearish";
            const message = `
⚠️ *EMA CONVERGENCE ALERT*
Token: ${symbol}
Timeframe: ${timeframe}
Trend: ${trend}
EMA60: ${ema60Record.value.toFixed(2)}
EMA223: ${ema223Record.value.toFixed(2)}
Difference: ${(Math.abs(ema60Record.value - ema223Record.value) / ema223Record.value * 100).toFixed(3)}%

EMAs are getting close to crossing!
`;
            
            const subscribers = getSubscribers();
            for (const chatId of subscribers) {
              await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
          }

          if (!lastCross || lastCross.crossType === 'BULLISH' !== isBullishNow) {
            const cross = await prisma.eMACross.create({
              data: {
                tokenId: tokenRecord.id,
                ema1Id: ema60Record.id,
                ema2Id: ema223Record.id,
                crossType: isBullishNow ? 'BULLISH' : 'BEARISH',
                timeframe
              },
              include: { token: true }
            });
            
            console.log(`[${new Date().toISOString()}] 🚨 ${symbol} ${timeframe} ${isBullishNow ? '🟢 BULLISH' : '🔴 BEARISH'} cross detected!`);
            await notifyCrossing(cross);
          }

          await delay(1000);

        } catch (error) {
          console.error(`[${new Date().toISOString()}] ❌ Error processing ${token} ${timeframe}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error in fetch cycle:`, error);
  }
}

// Run every 5 minutes
export const startPriceTracking = () => {
  console.log(`[${new Date().toISOString()}] 🚀 Starting price tracking service`);
  cron.schedule('*/5 * * * *', async () => {
    try {
      await fetchEmas();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error in cron:`, error);
    }
  });
}; 