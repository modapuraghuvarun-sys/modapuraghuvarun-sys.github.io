import { PrismaClient } from '@prisma/client';

// Use the resolved IP address for testing
const DATABASE_URL = "postgresql://Raghuvarun:npg_QxRMEZy7D2ea@98.91.36.187:5432/JOBGENIUSAI?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Connecting to Prisma using IP:', DATABASE_URL);
  try {
    const userCount = await prisma.user.count();
    console.log('Connection successful using IP. User count:', userCount);
  } catch (error) {
    console.error('Prisma Error using IP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
