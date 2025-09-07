import { Request, Response, NextFunction } from 'express';
import { redisService } from '../../services/redis/redisService';
import { isRedisAvailable } from '../../config/redis';
import logger from '../../utils/logger';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean;     // Skip counting failed requests
  message?: string;        // Custom error message
  statusCode?: number;     // Custom status code
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number;
}

/**
 * Redis-based rate limiting middleware
 */
export const createRedisRateLimit = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip rate limiting if Redis is not available (e.g., in test environment)
      if (!isRedisAvailable()) {
        logger.warn('Redis not available, skipping rate limiting');
        return next();
      }

      // Generate rate limit key
      const key = config.keyGenerator ? 
        config.keyGenerator(req) : 
        `rate_limit:${req.ip || 'unknown'}:${req.path}`;

      // Check if rate limit is exceeded
      const currentCount = await redisService.incrementRateLimit(key, Math.ceil(config.windowMs / 1000));
      
      if (currentCount > config.maxRequests) {
        // Rate limit exceeded
        const resetTime = Math.ceil(config.windowMs / 1000);
        const retryAfter = resetTime;
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': retryAfter.toString()
        });

        const statusCode = config.statusCode || 429;
        const message = config.message || 'Too many requests, please try again later.';

        res.status(statusCode).json({
          success: false,
          message,
          error: 'RATE_LIMIT_EXCEEDED',
          rateLimit: {
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime,
            retryAfter
          }
        });
        return;
      }

      // Rate limit not exceeded, set headers
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = Math.ceil(config.windowMs / 1000);

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      });

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // On Redis error, allow request to proceed
      next();
    }
  };
};

/**
 * User-specific rate limiting (based on user ID)
 */
export const createUserRateLimit = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get user ID from request (assuming it's set by auth middleware)
      const userId = (req as any).user?.userId || req.ip || 'unknown';
      const key = `rate_limit:user:${userId}:${req.path}`;

      const currentCount = await redisService.incrementRateLimit(key, Math.ceil(config.windowMs / 1000));
      
      if (currentCount > config.maxRequests) {
        const resetTime = Math.ceil(config.windowMs / 1000);
        const retryAfter = resetTime;
        
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': retryAfter.toString()
        });

        res.status(429).json({
          success: false,
          message: 'User rate limit exceeded',
          error: 'USER_RATE_LIMIT_EXCEEDED',
          rateLimit: {
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime,
            retryAfter
          }
        });
        return;
      }

      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = Math.ceil(config.windowMs / 1000);

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      });

      next();
    } catch (error) {
      logger.error('User rate limiting error:', error);
      next();
    }
  };
};

/**
 * Department-specific rate limiting
 */
export const createDepartmentRateLimit = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get department ID from request
      const departmentId = (req as any).user?.['departmentId'] || req.params['departmentId'] || 'unknown';
      const key = `rate_limit:dept:${departmentId}:${req.path}`;

      const currentCount = await redisService.incrementRateLimit(key, Math.ceil(config.windowMs / 1000));
      
      if (currentCount > config.maxRequests) {
        const resetTime = Math.ceil(config.windowMs / 1000);
        const retryAfter = resetTime;
        
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': retryAfter.toString()
        });

        res.status(429).json({
          success: false,
          message: 'Department rate limit exceeded',
          error: 'DEPARTMENT_RATE_LIMIT_EXCEEDED',
          rateLimit: {
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime,
            retryAfter
          }
        });
        return;
      }

      const remaining = Math.max(0, config.maxRequests - currentCount);
      const resetTime = Math.ceil(config.windowMs / 1000);

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      });

      next();
    } catch (error) {
      logger.error('Department rate limiting error:', error);
      next();
    }
  };
};

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  },

  // Standard rate limiting for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded, please try again later.'
  },

  // User-specific rate limiting
  user: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'User rate limit exceeded, please try again later.'
  },

  // Department-specific rate limiting
  department: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Department rate limit exceeded, please try again later.'
  },

  // File upload rate limiting
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Upload rate limit exceeded, please try again later.'
  }
};

/**
 * Get rate limit information for a key
 */
export const getRateLimitInfo = async (key: string): Promise<RateLimitInfo | null> => {
  try {
    const count = await redisService.getRateLimit(key);
    if (count === null) return null;

    // This is a simplified version - in production you'd want to store the limit and window
    const limit = 100; // Default limit
    const remaining = Math.max(0, limit - count);
    const reset = 60; // Default 60 seconds
    const retryAfter = count >= limit ? reset : 0;

    return { limit, remaining, reset, retryAfter };
  } catch (error) {
    logger.error('Failed to get rate limit info:', error);
    return null;
  }
};

/**
 * Reset rate limit for a key
 */
export const resetRateLimit = async (key: string): Promise<void> => {
  try {
    await redisService.deleteCache(key);
  } catch (error) {
    logger.error('Failed to reset rate limit:', error);
  }
}; 