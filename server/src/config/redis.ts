import { createClient, RedisClientType } from 'redis';
import { config } from './environment';

// Redis client configuration
export const redisConfig = {
  url: `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}/${config.redis.db}`,
  socket: {
    connectTimeout: 20000,
    lazyConnect: false,
  },
  retry_strategy: (options: any) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
};

// Create Redis client
export const redisClient: RedisClientType = createClient(redisConfig);

// Handle Redis events
redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.on('end', () => {
  console.log('Redis client disconnected');
});

redisClient.on('reconnecting', () => {
  console.log('Redis client reconnecting...');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('Redis connection established');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log('Redis connection closed');
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
};

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    // Check if client is already connected
    if (redisClient.isOpen) {
      await redisClient.ping();
      console.log('Redis connection test successful');
      return true;
    } else {
      // Try to connect first
      await redisClient.connect();
      await redisClient.ping();
      console.log('Redis connection test successful');
      return true;
    }
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

// Check if Redis client is available (for test environments)
export const isRedisAvailable = (): boolean => {
  return redisClient && redisClient.isOpen;
};

// Health check for Redis
export const redisHealthCheck = async (): Promise<{ status: string; timestamp: string; responseTime: number }> => {
  const start = Date.now();
  try {
    await redisClient.ping();
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
    };
  }
};

// Get Redis client instance
export const getRedisClient = (): RedisClientType => redisClient;

// Cache utility functions
export const setCache = async (key: string, value: any, ttl?: number): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  } catch (error) {
    console.error('Error setting cache:', error);
    throw error;
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error);
    throw error;
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await redisClient.flushDb();
    console.log('Redis cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
}; 