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
 * Kiosk authentication middleware - supports both JWT and kiosk API key authentication
 * For kiosk operations, we allow:
 * 1. Regular JWT authentication for logged-in users
 * 2. Kiosk API key authentication for kiosk devices
 * 3. Limited public access for QR verification
 */
export const kioskAuth = async (
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

    // For QR verification, allow limited public access
    if (req.path === '/verify-qr' && req.method === 'GET') {
      // Still validate the request has a QR code parameter
      const { qrCode } = req.query;
      if (!qrCode || typeof qrCode !== 'string') {
        res.status(400).json({
          success: false,
          message: 'QR code is required for verification',
          error: 'MISSING_QR_CODE',
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }
      next();
      return;
    }

    // Try JWT authentication first
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const result = await authService.validateToken(token);

        if (result.success) {
          // Set user info in request for authenticated users
          req.user = result.data?.user;
          next();
          return;
        }
      } catch (error) {
        // JWT validation failed, continue to kiosk auth
      }
    }

    // Check for kiosk API key in headers
    const kioskApiKeyHeader = req.headers['x-kiosk-api-key'];
    const kioskApiKey = Array.isArray(kioskApiKeyHeader) ? kioskApiKeyHeader[0] : kioskApiKeyHeader;

    if (kioskApiKey) {
      // Validate kiosk API key (this should be stored securely, e.g., in environment variables)
      const validKioskKeys = (process.env.KIOSK_API_KEYS || '')
        .split(',')
        .map(key => key.trim());

      if (validKioskKeys.includes(kioskApiKey.trim())) {
        // Set kiosk context in request
        req.kioskContext = {
          authenticated: true,
          apiKey: kioskApiKey,
          type: 'kiosk_device'
        };
        next();
        return;
      }
    }

    // If we reach here, authentication failed
    res.status(401).json({
      success: false,
      message: 'Authentication required for kiosk operations',
      error: 'AUTHENTICATION_REQUIRED',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication service error',
      error: 'AUTH_SERVICE_ERROR',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });
  }
};

/**
 * Middleware to require authenticated user (not just kiosk device)
 */
export const requireUserAuth = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User authentication required',
      error: 'USER_AUTH_REQUIRED',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });
    return;
  }
  next();
};

/**
 * Middleware to require kiosk device authentication
 */
export const requireKioskAuth = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.kioskContext?.authenticated) {
    res.status(401).json({
      success: false,
      message: 'Kiosk device authentication required',
      error: 'KIOSK_AUTH_REQUIRED',
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req)
    });
    return;
  }
  next();
};
