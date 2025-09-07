import { Request, Response, NextFunction } from 'express';
import { redisService } from '../../services/redis/redisService';
import { verifyAccessToken } from '../../config/jwt';
import { isRedisAvailable } from '../../config/redis';
import logger from '../../utils/logger';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface AuthenticatedRequest extends Request {
  session?: SessionData;
  sessionId?: string;
}

/**
 * Session middleware that manages user sessions using Redis
 */
export const sessionMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // No token, continue without session
      return next();
    }

    // Verify the JWT token
    const decoded = verifyAccessToken(token) as any;
    if (!decoded || !decoded.userId) {
      // Invalid token, continue without session
      return next();
    }

    // Generate session ID from user ID and token
    const sessionId = `session:${decoded.userId}:${token.substring(0, 16)}`;
    req.sessionId = sessionId;

    // Skip session management if Redis is not available (e.g., in test environment)
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, skipping session management');
      return next();
    }

    // Try to get existing session from Redis
    let sessionData = await redisService.getSession<SessionData>(sessionId);

    if (!sessionData) {
      // Create new session
      sessionData = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        isActive: decoded.isActive,
        lastActivity: new Date().toISOString(),
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };

      // Store session in Redis with 24-hour expiry
      await redisService.setSession(sessionId, sessionData, 86400);
      logger.info(`New session created for user ${decoded.userId}`);
    } else {
      // Update last activity
      sessionData.lastActivity = new Date().toISOString();
      sessionData.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      sessionData.userAgent = req.get('User-Agent') || 'unknown';

      // Refresh session expiry
      await redisService.refreshSession(sessionId, 86400);
    }

    req.session = sessionData;
    next();
  } catch (error) {
    logger.error('Session middleware error:', error);
    // Continue without session on error
    next();
  }
};

/**
 * Session validation middleware - ensures valid session exists
 */
export const requireSession = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session) {
    res.status(401).json({
      success: false,
      message: 'Valid session required',
      error: 'SESSION_REQUIRED'
    });
    return;
  }

  // Check if session is still active
  if (!req.session.isActive) {
    res.status(401).json({
      success: false,
      message: 'Session is inactive',
      error: 'SESSION_INACTIVE'
    });
    return;
  }

  next();
};

/**
 * Session cleanup middleware - removes expired sessions
 */
export const sessionCleanup = async (): Promise<void> => {
  try {
    // This would typically run as a scheduled job
    // For now, we'll just log that it's available
    logger.info('Session cleanup middleware available');
  } catch (error) {
    logger.error('Session cleanup error:', error);
  }
};

/**
 * Invalidate user sessions (for logout, password change, etc.)
 */
export const invalidateUserSessions = async (userId: string): Promise<void> => {
  try {
    const pattern = `session:${userId}:*`;
    await redisService.clearCache(pattern);
    logger.info(`Invalidated all sessions for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to invalidate sessions for user ${userId}:`, error);
  }
};

/**
 * Get active sessions for a user
 */
export const getUserActiveSessions = async (userId: string): Promise<SessionData[]> => {
  try {
    const pattern = `session:${userId}:*`;
    const keys = await redisService.getKeys(pattern);
    const sessions: SessionData[] = [];

    for (const key of keys) {
      const sessionData = await redisService.getCache<SessionData>(key);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  } catch (error) {
    logger.error(`Failed to get active sessions for user ${userId}:`, error);
    return [];
  }
};

/**
 * Session activity tracking middleware
 */
export const trackSessionActivity = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (req.session && req.sessionId) {
    // Update last activity in background
    redisService.refreshSession(req.sessionId, 86400).catch(error => {
      logger.error('Failed to refresh session activity:', error);
    });
  }
  next();
}; 