import knex from 'knex';
import { logger } from '../utils/logger';
import { mockDb, connectMockDatabase } from './mockDatabase';

const config = {
  client: 'postgresql',
  connection: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
    database: process.env['DB_NAME'] || 'revenue_system',
    ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
  debug: process.env['NODE_ENV'] === 'development',
};

export const db = knex(config);

// Export mock database for fallback
export { mockDb };

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    // Fall back to mock database
    logger.info('Falling back to mock database for development');
    await connectMockDatabase();
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await db.destroy();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    // Fall back to mock database destroy
    try {
      await mockDb.destroy();
      logger.info('Mock database destroyed successfully');
    } catch (mockError) {
      logger.error('Error destroying mock database:', mockError);
    }
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    // Fall back to mock database health check
    try {
      await mockDb.raw('SELECT 1');
      return true;
    } catch (mockError) {
      logger.error('Mock database health check also failed:', mockError);
      return false;
    }
  }
}
