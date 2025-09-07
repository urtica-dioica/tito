import { Request, Response } from 'express';
import { redisService } from '../../services/redis/redisService';
import { cacheUtils } from '../../middleware/redis/cacheMiddleware';
import logger from '../../utils/logger';

export class RedisController {
  /**
   * Get Redis health status
   */
  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const health = await redisService.healthCheck();
      
      res.json({
        success: true,
        message: 'Redis health check completed',
        data: {
          redis: health,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Redis health check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Redis health check failed',
        error: 'REDIS_HEALTH_CHECK_FAILED'
      });
    }
  }

  /**
   * Get Redis statistics
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const [cacheStats, memoryUsage] = await Promise.all([
        cacheUtils.getCacheStats(),
        redisService.getMemoryUsage()
      ]);

      res.json({
        success: true,
        message: 'Redis statistics retrieved',
        data: {
          cache: cacheStats,
          memory: memoryUsage,
          connection: {
            status: redisService.getConnectionStatus(),
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get Redis stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Redis statistics',
        error: 'REDIS_STATS_FAILED'
      });
    }
  }

  /**
   * Get cache keys by pattern
   */
  async getKeys(req: Request, res: Response): Promise<void> {
    try {
      const { pattern = '*' } = req.query;
      const keys = await redisService.getKeys(pattern as string);

      res.json({
        success: true,
        message: 'Cache keys retrieved',
        data: {
          pattern: pattern as string,
          count: keys.length,
          keys: keys.slice(0, 100), // Limit to first 100 keys
          total: keys.length
        }
      });
    } catch (error) {
      logger.error('Failed to get cache keys:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cache keys',
        error: 'REDIS_KEYS_FAILED'
      });
    }
  }

  /**
   * Get specific cache value
   */
  async getCacheValue(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Cache key is required',
          error: 'KEY_REQUIRED'
        });
        return;
      }
      const value = await redisService.getCache(key);

      if (value === null) {
        res.status(404).json({
          success: false,
          message: 'Cache key not found',
          error: 'CACHE_KEY_NOT_FOUND'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cache value retrieved',
        data: {
          key,
          value,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get cache value:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cache value',
        error: 'REDIS_GET_FAILED'
      });
    }
  }

  /**
   * Set cache value
   */
  async setCacheValue(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Cache key is required',
          error: 'KEY_REQUIRED'
        });
        return;
      }
      const { value, ttl } = req.body;

      if (value === undefined) {
        res.status(400).json({
          success: false,
          message: 'Value is required',
          error: 'VALUE_REQUIRED'
        });
        return;
      }

      await redisService.setCache(key, value, ttl);

      res.json({
        success: true,
        message: 'Cache value set successfully',
        data: {
          key,
          ttl: ttl || 'no expiry',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to set cache value:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set cache value',
        error: 'REDIS_SET_FAILED'
      });
    }
  }

  /**
   * Delete cache key
   */
  async deleteCacheKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      if (!key) {
        res.status(400).json({
          success: false,
          message: 'Cache key is required',
          error: 'KEY_REQUIRED'
        });
        return;
      }
      await redisService.deleteCache(key);

      res.json({
        success: true,
        message: 'Cache key deleted successfully',
        data: {
          key,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to delete cache key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete cache key',
        error: 'REDIS_DELETE_FAILED'
      });
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.query;
      
      if (pattern) {
        await redisService.clearCache(pattern as string);
      } else {
        await redisService.clearCache();
      }

      res.json({
        success: true,
        message: 'Cache cleared successfully',
        data: {
          pattern: pattern || 'all',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: 'REDIS_CLEAR_FAILED'
      });
    }
  }

  /**
   * Invalidate user cache
   */
  async invalidateUserCache(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
          error: 'USER_ID_REQUIRED'
        });
        return;
      }
      await cacheUtils.invalidateUserCache(userId);

      res.json({
        success: true,
        message: 'User cache invalidated successfully',
        data: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to invalidate user cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate user cache',
        error: 'REDIS_INVALIDATE_USER_FAILED'
      });
    }
  }

  /**
   * Invalidate department cache
   */
  async invalidateDepartmentCache(req: Request, res: Response): Promise<void> {
    try {
      const { departmentId } = req.params;
      if (!departmentId) {
        res.status(400).json({
          success: false,
          message: 'Department ID is required',
          error: 'DEPARTMENT_ID_REQUIRED'
        });
        return;
      }
      await cacheUtils.invalidateDepartmentCache(departmentId);

      res.json({
        success: true,
        message: 'Department cache invalidated successfully',
        data: {
          departmentId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to invalidate department cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate department cache',
        error: 'REDIS_INVALIDATE_DEPT_FAILED'
      });
    }
  }

  /**
   * Invalidate system cache
   */
  async invalidateSystemCache(_req: Request, res: Response): Promise<void> {
    try {
      await cacheUtils.invalidateSystemCache();

      res.json({
        success: true,
        message: 'System cache invalidated successfully',
        data: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to invalidate system cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate system cache',
        error: 'REDIS_INVALIDATE_SYSTEM_FAILED'
      });
    }
  }

  /**
   * Test Redis connection
   */
  async testConnection(_req: Request, res: Response): Promise<void> {
    try {
      const pingResult = await redisService.ping();
      
      if (pingResult === 'PONG') {
        res.json({
          success: true,
          message: 'Redis connection test successful',
          data: {
            ping: pingResult,
            status: 'connected',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Redis connection test failed',
          error: 'REDIS_PING_FAILED',
          data: {
            ping: pingResult,
            status: 'unexpected_response',
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error('Redis connection test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Redis connection test failed',
        error: 'REDIS_CONNECTION_TEST_FAILED'
      });
    }
  }
}

export const redisController = new RedisController(); 