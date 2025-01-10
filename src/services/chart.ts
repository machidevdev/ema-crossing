import prisma from './prisma';
import axios from 'axios';

export const generateCrossingChart = async (
  symbol: string, 
  timeframe: string,
  limit: number = 100
) => {
  // Fetch data
  const token = await prisma.token.findUnique({
    where: { symbol },
    include: {
      prices: {
        take: limit,
        orderBy: { timestamp: 'desc' }
      },
      emas: {
        where: { timeframe },
        take: limit * 2,
        orderBy: { timestamp: 'desc' }
      }
    }
  });

  if (!token) throw new Error(`Token ${symbol} not found`);

  const ema60Data = token.emas.filter(ema => ema.period === 60);
  const ema223Data = token.emas.filter(ema => ema.period === 223);

  const labels = token.prices.map(p => new Date(p.timestamp).toLocaleTimeString());
  const prices = token.prices.map(p => p.price);
  const ema60Values = ema60Data.map(e => e.value);
  const ema223Values = ema223Data.map(e => e.value);

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: 'gray',
          fill: false
        },
        {
          label: 'EMA60',
          data: ema60Values,
          borderColor: 'blue',
          fill: false
        },
        {
          label: 'EMA223',
          data: ema223Values,
          borderColor: 'red',
          fill: false
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: `${symbol} ${timeframe} Chart`
      }
    }
  }))}`;

  const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });
  return response.data;
}; 