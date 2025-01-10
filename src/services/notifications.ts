import { EMACross, Token } from '@prisma/client';
import { bot } from './bot';
import { getSubscribers } from './bot';

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
    const subscribers = getSubscribers();
    for (const chatId of subscribers) {
      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}; 