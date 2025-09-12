import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader } from '../../config/jwt';
import { authService } from '../../services/auth/authService';
import { ApiResponse } from '../../utils/types/express';

/**
 * Helper function to get request ID safely
 */
const getRequestId = (req: Request): string => {
  return req.requestId || 'unknown';
};

/**
 * Authenticate middleware - validates JWT token and sets user info
 */
export const authenticate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    // NOTE: Development authentication bypass removed for security
    // All requests must use proper JWT authentication

    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
        error: 'MISSING_TOKEN',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    const result = await authService.validateToken(token);
    
    if (!result.success) {
      res.status(401).json({
        success: false,
        message: result.message,
        error: result.error || 'INVALID_TOKEN',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    // Set user info in request
    req.user = result.data?.user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTHENTICATION_FAILED',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });
  }
};

/**
 * Optional authentication middleware - sets user info if token is valid
 */
export const authenticateOptional = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const result = await authService.validateToken(token);
      if (result.success) {
        req.user = result.data?.user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Require authentication - ensures user is logged in
 */
export const requireAuth = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_REQUIRED',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });
    return;
  }
  next();
};

/**
 * Get current user from request
 */
export const getCurrentUser = (req: Request) => {
  return req.user;
};

/**
 * Require specific role
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    if (req.user.role !== requiredRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    next();
  };
};

/**
 * Require any of the specified roles
 */
export const requireAnyRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
      return;
    }

    next();
  };
}; 