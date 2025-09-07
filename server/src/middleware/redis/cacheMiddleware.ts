import { Request, Response, NextFunction } from 'express';
import { redisService } from '../../services/redis/redisService';
import logger from '../../utils/logger';

export interface CacheConfig {
  ttlSeconds: number;           // Time to live in seconds
  keyGenerator?: (req: Request) => string; // Custom key generator
  condition?: (req: Request, res: Response) => boolean; // When to cache
  invalidateOn?: string[];      // Invalidate cache on specific methods
  userSpecific?: boolean;       // Include user ID in cache key
  departmentSpecific?: boolean; // Include department ID in cache key
}

export interface CacheInfo {
  cached: boolean;
  key: string;
  ttl: number;
  timestamp: string;
}

/**
 * Redis-based response caching middleware
 */
export const createCacheMiddleware = (config: CacheConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if we should cache this request
      if (config.condition && !config.condition(req, res)) {
        return next();
      }

      // Generate cache key
      let cacheKey = config.keyGenerator ? 
        config.keyGenerator(req) : 
        `cache:${req.method}:${req.path}`;

      // Add query parameters to cache key
      if (Object.keys(req.query).length > 0) {
        const queryString = JSON.stringify(req.query);
        cacheKey += `:${Buffer.from(queryString).toString('base64').substring(0, 16)}`;
      }

      // Add user-specific prefix if enabled
      if (config.userSpecific && (req as any).user?.userId) {
        cacheKey = `user:${(req as any).user.userId}:${cacheKey}`;
      }

      // Add department-specific prefix if enabled
      if (config.departmentSpecific && (req as any).user?.departmentId) {
        cacheKey = `dept:${(req as any).user.departmentId}:${cacheKey}`;
      }

      // Try to get cached response
      const cachedResponse = await redisService.getCache<any>(cacheKey);
      
      if (cachedResponse) {
        // Return cached response
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': config.ttlSeconds.toString()
        });

        res.json(cachedResponse);
        return;
      }

      // No cache hit, intercept response to cache it
      const originalJson = res.json;
      const originalSend = res.send;

      res.json = function(data: any) {
        // Cache the response
        redisService.setCache(cacheKey, data, config.ttlSeconds).catch(error => {
          logger.error('Failed to cache response:', error);
        });

        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': config.ttlSeconds.toString()
        });

        // Call original method
        return originalJson.call(this, data);
      };

      res.send = function(data: any) {
        // Try to parse as JSON for caching
        try {
          const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
          redisService.setCache(cacheKey, jsonData, config.ttlSeconds).catch(error => {
            logger.error('Failed to cache response:', error);
          });
        } catch (error) {
          // Not JSON, skip caching
        }

        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': config.ttlSeconds.toString()
        });

        // Call original method
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // On error, continue without caching
      next();
    }
  };
};

/**
 * Database query caching middleware
 */
export const createQueryCacheMiddleware = (config: CacheConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate cache key for database queries
      let cacheKey = `query:${req.path}`;
      
      if (Object.keys(req.query).length > 0) {
        const queryString = JSON.stringify(req.query);
        cacheKey += `:${Buffer.from(queryString).toString('base64').substring(0, 16)}`;
      }

      if (Object.keys(req.params).length > 0) {
        const paramsString = JSON.stringify(req.params);
        cacheKey += `:${Buffer.from(paramsString).toString('base64').substring(0, 16)}`;
      }

      // Add user-specific prefix if enabled
      if (config.userSpecific && (req as any).user?.userId) {
        cacheKey = `user:${(req as any).user.userId}:${cacheKey}`;
      }

      // Add department-specific prefix if enabled
      if (config.departmentSpecific && (req as any).user?.departmentId) {
        cacheKey = `dept:${(req as any).user.departmentId}:${cacheKey}`;
      }

      // Try to get cached query result
      const cachedResult = await redisService.getCache<any>(cacheKey);
      
      if (cachedResult) {
        res.set({
          'X-Query-Cache': 'HIT',
          'X-Query-Cache-Key': cacheKey,
          'X-Query-Cache-TTL': config.ttlSeconds.toString()
        });

        res.json(cachedResult);
        return;
      }

      // No cache hit, continue to next middleware
      res.set({
        'X-Query-Cache': 'MISS',
        'X-Query-Cache-Key': cacheKey,
        'X-Query-Cache-TTL': config.ttlSeconds.toString()
      });

      next();
    } catch (error) {
      logger.error('Query cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 */
export const createCacheInvalidationMiddleware = (patterns: string[]) => {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Invalidate cache patterns after successful operations
      const originalJson = res.json;
      const originalSend = res.send;

      res.json = function(data: any) {
        // Invalidate cache patterns
        patterns.forEach(pattern => {
          redisService.clearCache(pattern).catch(error => {
            logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
          });
        });

        // Call original method
        return originalJson.call(this, data);
      };

      res.send = function(data: any) {
        // Invalidate cache patterns
        patterns.forEach(pattern => {
          redisService.clearCache(pattern).catch(error => {
            logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
          });
        });

        // Call original method
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

/**
 * Predefined cache configurations
 */
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: {
    ttlSeconds: 300, // 5 minutes
    userSpecific: false,
    departmentSpecific: false
  },

  // Medium-term cache for moderately changing data
  medium: {
    ttlSeconds: 3600, // 1 hour
    userSpecific: false,
    departmentSpecific: false
  },

  // Long-term cache for rarely changing data
  long: {
    ttlSeconds: 86400, // 24 hours
    userSpecific: false,
    departmentSpecific: false
  },

  // User-specific cache
  user: {
    ttlSeconds: 1800, // 30 minutes
    userSpecific: true,
    departmentSpecific: false
  },

  // Department-specific cache
  department: {
    ttlSeconds: 3600, // 1 hour
    userSpecific: false,
    departmentSpecific: true
  },

  // Authentication cache (very short)
  auth: {
    ttlSeconds: 60, // 1 minute
    userSpecific: true,
    departmentSpecific: false
  }
};

/**
 * Cache utility functions
 */
export const cacheUtils = {
  /**
   * Invalidate all user-specific cache
   */
  invalidateUserCache: async (userId: string): Promise<void> => {
    try {
      await redisService.deleteUserCache(userId);
      logger.info(`Invalidated all cache for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate user cache for ${userId}:`, error);
    }
  },

  /**
   * Invalidate all department-specific cache
   */
  invalidateDepartmentCache: async (departmentId: string): Promise<void> => {
    try {
      await redisService.deleteDepartmentCache(departmentId);
      logger.info(`Invalidated all cache for department ${departmentId}`);
    } catch (error) {
      logger.error(`Failed to invalidate department cache for ${departmentId}:`, error);
    }
  },

  /**
   * Invalidate system-wide cache
   */
  invalidateSystemCache: async (): Promise<void> => {
    try {
      await redisService.clearCache('system:*');
      logger.info('Invalidated all system cache');
    } catch (error) {
      logger.error('Failed to invalidate system cache:', error);
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: async (): Promise<{ totalKeys: number; memoryUsage: { used: number; peak: number } }> => {
    try {
      const keys = await redisService.getKeys('*');
      const memoryUsage = await redisService.getMemoryUsage();
      
      return {
        totalKeys: keys.length,
        memoryUsage
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return { totalKeys: 0, memoryUsage: { used: 0, peak: 0 } };
    }
  }
}; 