import prisma from './prisma';

export const initializeDatabase = async () => {
  console.log('🚀 Initializing database...');
  
  // Initialize tokens
  const tokens = ['SOL', 'ETH', 'BTC'];
  
  for (const symbol of tokens) {
    await prisma.token.upsert({
      where: { symbol },
      create: { symbol },
      update: {}
    });
  }
  
  console.log('✅ Database initialized');
}; 