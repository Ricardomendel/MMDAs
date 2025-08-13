import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: any = null;
let isConnected = false;

// For development, completely disable Redis
const REDIS_ENABLED = process.env['REDIS_ENABLED'] === 'true';

function createRedisClient() {
  if (!REDIS_ENABLED) {
    return null;
  }
  
  if (!redisClient) {
    redisClient = createClient({
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
      },
    });

    redisClient.on('error', (err: any) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
      isConnected = true;
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
      isConnected = false;
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  if (!REDIS_ENABLED) {
    logger.info('Redis is disabled for development');
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && !isConnected) {
      await client.connect();
      logger.info('Redis connection established successfully');
    }
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      logger.info('Redis connection closed successfully');
      isConnected = false;
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}

// Cache utility functions
export async function setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      await client.setEx(key, ttl, JSON.stringify(value));
    }
  } catch (error) {
    logger.error('Error setting cache:', error);
  }
}

export async function getCache(key: string): Promise<any | null> {
  if (!REDIS_ENABLED) {
    return null;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      await client.del(key);
    }
  } catch (error) {
    logger.error('Error deleting cache:', error);
  }
}

export async function clearCache(): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      await client.flushAll();
      logger.info('Cache cleared successfully');
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
}

// Session management
export async function setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      await client.setEx(`session:${sessionId}`, ttl, JSON.stringify(data));
    }
  } catch (error) {
    logger.error('Error setting session:', error);
  }
}

export async function getSession(sessionId: string): Promise<any | null> {
  if (!REDIS_ENABLED) {
    return null;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      const value = await client.get(`session:${sessionId}`);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    logger.error('Error getting session:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!REDIS_ENABLED) {
    return;
  }
  
  try {
    const client = createRedisClient();
    if (client && isConnected) {
      await client.del(`session:${sessionId}`);
    }
  } catch (error) {
    logger.error('Error deleting session:', error);
  }
}

export { createRedisClient as redisClient };
