import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

// Create Prisma client instance
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log queries in development
if (process.env['NODE_ENV'] === 'development') {
  prisma.$on('query', (e: any) => {
    logger.info('Query: ' + e.query);
    logger.info('Params: ' + e.params);
    logger.info('Duration: ' + e.duration + 'ms');
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma error:', e);
});

// Connect to database
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Prisma database connected successfully');
  } catch (error) {
    logger.error('Prisma database connection failed:', error);
    throw error;
  }
}

// Disconnect from database
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Prisma database disconnected successfully');
  } catch (error) {
    logger.error('Prisma database disconnection failed:', error);
  }
}

// Health check
export async function checkPrismaHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Prisma health check failed:', error);
    return false;
  }
}

// Export Prisma client
export { prisma };
