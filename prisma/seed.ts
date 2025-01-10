import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tokens = ['SOL', 'ETH', 'BTC'];
  
  for (const symbol of tokens) {
    await prisma.token.upsert({
      where: { symbol },
      create: { symbol },
      update: {}
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 