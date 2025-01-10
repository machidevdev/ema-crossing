import { EMACross, Token } from '@prisma/client';
import { bot } from './bot';
import { getSubscribers } from './bot';
import { generateCrossingChart } from './chart';

export const notifyCrossing = async (cross: EMACross & { token: Token }) => {
  const emoji = cross.crossType === 'BULLISH' ? '🟢' : '🔴';
  const message = `
${emoji} *EMA CROSSING ALERT*
Token: ${cross.token.symbol}
Timeframe: ${cross.timeframe}
Type: ${cross.crossType}
Time: ${cross.timestamp.toLocaleString()}

EMA60 has crossed ${cross.crossType === 'BULLISH' ? 'above' : 'below'} EMA223
`;

  try {
    // Generate chart
    const chartBuffer = await generateCrossingChart(
      cross.token.symbol,
      cross.timeframe
    );

    const subscribers = getSubscribers();
    for (const chatId of subscribers) {
      // Send photo with caption
      await bot.telegram.sendPhoto(chatId, 
        { source: chartBuffer },
        { 
          caption: message,
          parse_mode: 'Markdown'
        }
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}; 