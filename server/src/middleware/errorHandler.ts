import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/types/express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  errorCode?: string;
}

/**
 * Global error handling middleware
 * Provides consistent error responses and prevents information disclosure
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Log the error with context
  const errorContext = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Handle different types of errors
  if (error.name === 'ValidationError') {
    // Joi validation error
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
    logger.warn('Validation error:', errorContext);
  } else if (error.name === 'UnauthorizedError') {
    // JWT error
    statusCode = 401;
    message = 'Authentication failed';
    errorCode = 'AUTHENTICATION_ERROR';
    logger.warn('Authentication error:', errorContext);
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
    logger.warn('JWT error:', errorContext);
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
    logger.warn('Token expired:', errorContext);
  } else if (error.name === 'CastError') {
    // MongoDB cast error (if using MongoDB)
    statusCode = 400;
    message = 'Invalid data format';
    errorCode = 'INVALID_DATA';
    logger.warn('Cast error:', errorContext);
  } else if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
    errorCode = 'DUPLICATE_ENTRY';
    logger.warn('Duplicate entry error:', errorContext);
  } else if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference';
    errorCode = 'INVALID_REFERENCE';
    logger.warn('Foreign key error:', errorContext);
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    // Database connection error
    statusCode = 503;
    message = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
    logger.error('Database connection error:', errorContext);
  } else if (statusCode >= 500) {
    // Log server errors
    logger.error('Server error:', errorContext);
  } else {
    // Log other errors as warnings
    logger.warn('Application error:', errorContext);
  }

  // In production, don't leak error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
  }

  // Send error response
  const errorResponse: ApiResponse = {
    success: false,
    message,
    error: errorCode,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };

  // Include additional error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      name: error.name,
      stack: error.stack
    };
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Catch async errors and pass them to error handler
 */
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create operational errors (errors we expect and can handle)
 */
export const createOperationalError = (
  message: string,
  statusCode: number,
  errorCode?: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;

  if (errorCode) {
    (error as any).errorCode = errorCode;
  }

  return error;
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejections = (): void => {
  process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Promise Rejection:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Close server gracefully
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtExceptions = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });

    // Close server gracefully
    process.exit(1);
  });
};
