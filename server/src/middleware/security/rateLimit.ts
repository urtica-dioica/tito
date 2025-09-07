import { Request, Response, NextFunction } from 'express';
import { redisService } from '../../services/redis/redisService';

// Store for tracking requests when Redis is not available
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Create a rate limiter with Redis fallback to memory
 */
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100, // limit each IP to 100 requests per windowMs
  message: string = 'Too many requests from this IP, please try again later.',
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip;
      const now = Date.now();
      const windowStart = now - (now % windowMs);

      // Try Redis first
      try {
        const redisKey = `rate_limit:${key}:${windowStart}`;
        const currentCount = await redisService.getCache(redisKey);
        
        if (currentCount !== null) {
          const count = parseInt(currentCount as string);
          
          if (count >= max) {
            res.status(429).json({
              success: false,
              message,
              error: 'RATE_LIMIT_EXCEEDED',
              timestamp: new Date().toISOString(),
              requestId: req.requestId || 'unknown'
            });
            return;
          }
          
          // Increment count
          await redisService.setCache(redisKey, (count + 1).toString(), Math.ceil(windowMs / 1000));
          next();
          return;
        } else {
          // First request in this window
          await redisService.setCache(redisKey, '1', Math.ceil(windowMs / 1000));
          next();
          return;
        }
      } catch (redisError) {
        // Fallback to memory store
        console.warn('Redis rate limiting failed, falling back to memory store:', redisError);
        
        const memoryKey = `${key}:${windowStart}`;
        const current = memoryStore.get(memoryKey);
        
        if (current && current.resetTime > now) {
          if (current.count >= max) {
            res.status(429).json({
              success: false,
              message,
              error: 'RATE_LIMIT_EXCEEDED',
              timestamp: new Date().toISOString(),
              requestId: req.requestId || 'unknown'
            });
            return;
          }
          
          current.count++;
        } else {
          memoryStore.set(memoryKey, { count: 1, resetTime: now + windowMs });
        }
        
        // Clean up old entries
        for (const [key, value] of memoryStore.entries()) {
          if (value.resetTime <= now) {
            memoryStore.delete(key);
          }
        }
        
        next();
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request
      next();
    }
  };
};

/**
 * General API rate limiter
 */
export const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per 15 minutes
  'Too many API requests, please try again later.'
);

/**
 * Authentication endpoints rate limiter (stricter)
 */
export const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per 15 minutes
  'Too many authentication attempts, please try again later.',
  (req: Request) => `auth:${req.ip}`
);

/**
 * Login endpoint rate limiter (very strict)
 */
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  3, // 3 login attempts per 15 minutes
  'Too many login attempts, please try again later.',
  (req: Request) => `login:${req.ip}`
);

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 password reset attempts per hour
  'Too many password reset attempts, please try again later.',
  (req: Request) => `password_reset:${req.ip}`
);

/**
 * File upload rate limiter
 */
export const uploadRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 uploads per hour
  'Too many file uploads, please try again later.',
  (req: Request) => `upload:${req.ip}`
);

/**
 * Admin endpoints rate limiter
 */
export const adminRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests per 15 minutes (higher for admin operations)
  'Too many admin requests, please try again later.',
  (req: Request) => `admin:${req.ip}`
);

/**
 * Custom rate limiter for specific endpoints
 */
export const createCustomRateLimiter = (
  windowMs: number,
  max: number,
  message: string,
  keyGenerator?: (req: Request) => string
) => {
  return createRateLimiter(windowMs, max, message, keyGenerator);
};

/**
 * Rate limiter for specific user actions
 */
export const userActionRateLimiter = (action: string) => {
  return createRateLimiter(
    60 * 60 * 1000, // 1 hour
    50, // 50 actions per hour
    `Too many ${action} attempts, please try again later.`,
    (req: Request) => `${action}:${req.ip}`
  );
};

/**
 * Rate limiter for department-specific operations
 */
export const departmentRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  30, // 30 requests per 15 minutes
  'Too many department operations, please try again later.',
  (req: Request) => `dept:${req.ip}`
);

/**
 * Rate limiter for employee operations
 */
export const employeeRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests per 15 minutes
  'Too many employee operations, please try again later.',
  (req: Request) => `emp:${req.ip}`
);

/**
 * Rate limiter for attendance operations
 */
export const attendanceRateLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 requests per 5 minutes
  'Too many attendance operations, please try again later.',
  (req: Request) => `attendance:${req.ip}`
);

/**
 * Rate limiter for payroll operations
 */
export const payrollRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests per hour
  'Too many payroll operations, please try again later.',
  (req: Request) => `payroll:${req.ip}`
); 