import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ErrorResponse } from '../../utils/types/express';

/**
 * Validation middleware using Joi schemas
 */
export const validate = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      const data = req[property];
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: errorDetails
        });
        return;
      }

      // Replace the request data with validated data
      req[property] = value;
      next();
          } catch (error) {
        console.error('Validation middleware error:', error);
        
        res.status(500).json({
          success: false,
          message: 'Validation processing failed',
          error: 'VALIDATION_PROCESSING_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Schema) => validate(schema, 'body');

/**
 * Validate request query parameters
 */
export const validateQuery = (schema: Schema) => validate(schema, 'query');

/**
 * Validate request path parameters
 */
export const validateParams = (schema: Schema) => validate(schema, 'params');

/**
 * Validate multiple schemas for different properties
 */
export const validateMultiple = (schemas: {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}) => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      // Validate body
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: `body.${detail.path.join('.')}`,
            message: detail.message,
            type: detail.type
          }));

          res.status(400).json({
            success: false,
            message: 'Body validation failed',
            error: 'BODY_VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
            path: req.path,
            details: errorDetails
          });
          return;
        }

        req.body = value;
      }

      // Validate query
      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: `query.${detail.path.join('.')}`,
            message: detail.message,
            type: detail.type
          }));

          res.status(400).json({
            success: false,
            message: 'Query validation failed',
            error: 'QUERY_VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
            path: req.path,
            details: errorDetails
          });
          return;
        }

        req.query = value;
      }

      // Validate params
      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
          allowUnknown: false
        });

        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: `params.${detail.path.join('.')}`,
            message: detail.message,
            type: detail.type
          }));

          res.status(400).json({
            success: false,
            message: 'Path parameters validation failed',
            error: 'PARAMS_VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.requestId || 'unknown',
            path: req.path,
            details: errorDetails
          });
          return;
        }

        req.params = value;
      }

      next();
    } catch (error) {
      console.error('Multiple validation middleware error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Validation processing failed',
        error: 'VALIDATION_PROCESSING_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
        path: req.path
      });
      return;
    }
  };
};

/**
 * Custom validation function for complex business logic
 */
export const customValidate = (
  validator: (req: Request) => { isValid: boolean; errors: string[] }
) => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      const { isValid, errors } = validator(req);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Custom validation failed',
          error: 'CUSTOM_VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: errors.map(error => ({
            field: 'custom',
            message: error,
            type: 'custom'
          }))
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Custom validation middleware error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Custom validation processing failed',
        error: 'CUSTOM_VALIDATION_PROCESSING_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
        path: req.path
      });
      return;
    }
  };
};

/**
 * Sanitize input data to prevent XSS
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next();
  }
};

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate file upload
 * Note: This function requires multer middleware to be configured
 * and the Request type to be extended with the files property
 */
export const validateFileUpload = (_options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  return (_req: Request, _res: Response<ErrorResponse>, next: NextFunction): void => {
    // TODO: Implement file validation when multer is configured
    // For now, skip validation to avoid TypeScript errors
    console.warn('File validation middleware not yet implemented - requires multer configuration');
    next();
  };
}; 