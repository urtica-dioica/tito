import jwt from 'jsonwebtoken';
import { config } from './environment';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// JWT refresh payload interface
export interface JWTRefreshPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Generate access token
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, { 
    expiresIn: '15m',
    issuer: 'tito-hr-system',
    audience: 'tito-hr-users'
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JWTRefreshPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, { 
    expiresIn: '7d',
    issuer: 'tito-hr-system',
    audience: 'tito-hr-refresh'
  });
};

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'tito-hr-system',
      audience: 'tito-hr-users',
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTRefreshPayload => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'tito-hr-system',
      audience: 'tito-hr-refresh',
    }) as JWTRefreshPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Decode token without verification (for logging/debugging)
export const decodeToken = (token: string): JWTPayload | JWTRefreshPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload | JWTRefreshPayload | null;
  } catch (error) {
    return null;
  }
};

// Get token expiration time
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
    return true;
  } catch (error) {
    return true;
  }
};

// Generate token pair (access + refresh)
export const generateTokenPair = (
  userId: string,
  email: string,
  role: string,
  tokenVersion: number
): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken({ userId, email, role, tokenVersion });
  const refreshToken = generateRefreshToken({ userId, tokenVersion });

  return { accessToken, refreshToken };
};

// Token utilities
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

// Validate token format
export const isValidTokenFormat = (token: string): boolean => {
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}; 