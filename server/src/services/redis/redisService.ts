import { RedisClientType } from 'redis';
import { getRedisClient } from '../../config/redis';
import logger from '../../utils/logger';

export class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = getRedisClient();
    this.isConnected = this.client.isOpen;
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected && !this.client.isOpen) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      // Don't throw error, just log it
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.quit();
      }
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis ping failed:', error);
      throw error;
    }
  }

  // Cache Management
  async setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Failed to set cache for key ${key}:`, error);
      throw error;
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Failed to delete cache for key ${key}:`, error);
      throw error;
    }
  }

  async clearCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        await this.client.flushDb();
      }
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check existence for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(`Failed to set expiry for key ${key}:`, error);
      throw error;
    }
  }

  // Session Management
  async setSession(sessionId: string, sessionData: any, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.setCache(key, sessionData, ttlSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.getCache<T>(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.deleteCache(key);
  }

  async refreshSession(sessionId: string, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.expire(key, ttlSeconds);
  }

  // Rate Limiting
  async incrementRateLimit(key: string, windowSeconds: number = 60): Promise<number> {
    try {
      const currentCount = await this.client.incr(key);
      
      if (currentCount === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      return currentCount;
    } catch (error) {
      logger.error(`Failed to increment rate limit for key ${key}:`, error);
      return 0;
    }
  }

  async getRateLimit(key: string): Promise<number> {
    try {
      const count = await this.client.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      logger.error(`Failed to get rate limit for key ${key}:`, error);
      return 0;
    }
  }

  // User-specific caching
  async setUserCache(userId: string, key: string, value: any, ttlSeconds?: number): Promise<void> {
    const cacheKey = `user:${userId}:${key}`;
    await this.setCache(cacheKey, value, ttlSeconds);
  }

  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    const cacheKey = `user:${userId}:${key}`;
    return await this.getCache<T>(cacheKey);
  }

  async deleteUserCache(userId: string, key?: string): Promise<void> {
    if (key) {
      const cacheKey = `user:${userId}:${key}`;
      await this.deleteCache(cacheKey);
    } else {
      const pattern = `user:${userId}:*`;
      await this.clearCache(pattern);
    }
  }

  // Department-specific caching
  async setDepartmentCache(departmentId: string, key: string, value: any, ttlSeconds?: number): Promise<void> {
    const cacheKey = `dept:${departmentId}:${key}`;
    await this.setCache(cacheKey, value, ttlSeconds);
  }

  async getDepartmentCache<T>(departmentId: string, key: string): Promise<T | null> {
    const cacheKey = `dept:${departmentId}:${key}`;
    return await this.getCache<T>(cacheKey);
  }

  async deleteDepartmentCache(departmentId: string, key?: string): Promise<void> {
    if (key) {
      const cacheKey = `dept:${departmentId}:${key}`;
      await this.deleteCache(cacheKey);
    } else {
      const pattern = `dept:${departmentId}:*`;
      await this.clearCache(pattern);
    }
  }

  // System-wide caching
  async setSystemCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const cacheKey = `system:${key}`;
    await this.setCache(cacheKey, value, ttlSeconds);
  }

  async getSystemCache<T>(key: string): Promise<T | null> {
    const cacheKey = `system:${key}`;
    return await this.getSystemCache<T>(cacheKey);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Redis client is not connected',
          timestamp: new Date().toISOString()
        };
      }

      const pingResult = await this.ping();
      if (pingResult === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis is responding correctly',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis ping returned unexpected response',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Redis health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility methods
  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Failed to get keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  async getMemoryUsage(): Promise<{ used: number; peak: number }> {
    try {
      const info = await this.client.info('memory');
      const lines = info.split('\n');
      let used = 0;
      let peak = 0;

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          const parts = line.split(':');
          if (parts[1]) {
            used = parseInt(parts[1]);
          }
        } else if (line.startsWith('used_memory_peak:')) {
          const parts = line.split(':');
          if (parts[1]) {
            peak = parseInt(parts[1]);
          }
        }
      }

      return { used, peak };
    } catch (error) {
      logger.error('Failed to get memory usage:', error);
      return { used: 0, peak: 0 };
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const redisService = new RedisService();

// Export utility functions for backward compatibility
export const setCache = async (key: string, value: any, ttlSeconds?: number): Promise<void> => {
  await redisService.setCache(key, value, ttlSeconds);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  return await redisService.getCache<T>(key);
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisService.deleteCache(key);
};

export const clearCache = async (pattern?: string): Promise<void> => {
  await redisService.clearCache(pattern);
}; 