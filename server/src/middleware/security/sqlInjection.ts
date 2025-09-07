import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../../utils/types/express';

/**
 * SQL Injection prevention patterns
 */
const SQL_INJECTION_PATTERNS = [
  // Common SQL keywords
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT|SCRIPT>)\b/i,
  
  // SQL comments
  /--/,
  /\/\*/,
  /\*\//,
  
  // SQL operators
  /\b(OR|AND)\s+\d+\s*=\s*\d+/i,
  /\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?/i,
  
  // SQL functions
  /\b(CHAR|CONCAT|SUBSTRING|LENGTH|COUNT|SUM|AVG|MAX|MIN)\s*\(/i,
  
  // SQL injection attempts
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  /(\bOR\b|\bAND\b)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?/i,
  
  // Hex encoded attacks
  /0x[0-9a-fA-F]+/i,
  
  // URL encoded attacks
  /%27|%22|%2D%2D|%2F%2A|%2A%2F/i,
  
  // Unicode attacks
  /\u0027|\u0022|\u002D\u002D|\u002F\u002A|\u002A\u002F/i,
  
  // Null byte attacks
  /\x00/,
  
  // Stacked queries
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,
  
  // Time-based attacks
  /(SLEEP|BENCHMARK|WAIT)\s*\(/i,
  
  // Boolean-based attacks
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+\s*--/i,
  
  // Error-based attacks
  /(UPDATEXML|EXTRACTVALUE|FLOOR|RAND)\s*\(/i
];

/**
 * Check if a string contains SQL injection patterns
 */
function containsSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Recursively check object for SQL injection
 */
function checkObjectForSqlInjection(obj: any): { hasInjection: boolean; field: string } {
  if (typeof obj === 'string') {
    if (containsSqlInjection(obj)) {
      return { hasInjection: true, field: 'string_value' };
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = checkObjectForSqlInjection(obj[i]);
      if (result.hasInjection) {
        return { hasInjection: true, field: `array[${i}]` };
      }
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const result = checkObjectForSqlInjection(value);
      if (result.hasInjection) {
        return { hasInjection: true, field: key };
      }
    }
  }
  
  return { hasInjection: false, field: '' };
}

/**
 * SQL Injection prevention middleware
 */
export const preventSqlInjection = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  try {
    // Check request body
    if (req.body) {
      const bodyCheck = checkObjectForSqlInjection(req.body);
      if (bodyCheck.hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in request body',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: bodyCheck.field,
            type: 'body'
          }
        });
        return;
      }
    }

    // Check query parameters
    if (req.query) {
      const queryCheck = checkObjectForSqlInjection(req.query);
      if (queryCheck.hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in query parameters',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: queryCheck.field,
            type: 'query'
          }
        });
        return;
      }
    }

    // Check path parameters
    if (req.params) {
      const paramsCheck = checkObjectForSqlInjection(req.params);
      if (paramsCheck.hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in path parameters',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: paramsCheck.field,
            type: 'query'
          }
        });
        return;
      }
    }

    // Check headers (for potential header injection)
    if (req.headers) {
      const headersCheck = checkObjectForSqlInjection(req.headers);
      if (headersCheck.hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in headers',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: headersCheck.field,
            type: 'headers'
          }
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('SQL injection prevention error:', error);
    
    // If prevention fails, block the request for safety
    res.status(500).json({
      success: false,
      message: 'Security check failed - request blocked',
      error: 'SECURITY_CHECK_FAILED',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      path: req.path
    });
    return;
  }
};

/**
 * Enhanced SQL injection prevention with logging
 */
export const preventSqlInjectionWithLogging = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  const startTime = Date.now();
  
  try {
    // Check request body
    if (req.body) {
      const bodyCheck = checkObjectForSqlInjection(req.body);
      if (bodyCheck.hasInjection) {
        // Log the attempt
        console.warn(`SQL Injection attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          body: req.body,
          field: bodyCheck.field,
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in request body',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: bodyCheck.field,
            type: 'body'
          }
        });
        return;
      }
    }

    // Check query parameters
    if (req.query) {
      const queryCheck = checkObjectForSqlInjection(req.query);
      if (queryCheck.hasInjection) {
        console.warn(`SQL Injection attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          query: req.query,
          field: queryCheck.field,
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in query parameters',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: queryCheck.field,
            type: 'query'
          }
        });
        return;
      }
    }

    // Check path parameters
    if (req.params) {
      const paramsCheck = checkObjectForSqlInjection(req.params);
      if (paramsCheck.hasInjection) {
        console.warn(`SQL Injection attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          params: req.params,
          field: paramsCheck.field,
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in path parameters',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: paramsCheck.field,
            type: 'params'
          }
        });
        return;
      }
    }

    // Check headers
    if (req.headers) {
      const headersCheck = checkObjectForSqlInjection(req.headers);
      if (headersCheck.hasInjection) {
        console.warn(`SQL Injection attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          headers: req.headers,
          field: headersCheck.field,
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected in headers',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: headersCheck.field,
            type: 'headers'
          }
        });
        return;
      }
    }

    // Log successful security check
    const duration = Date.now() - startTime;
    if (duration > 100) { // Log slow security checks
      console.info(`Security check completed in ${duration}ms:`, {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        path: req.path,
        method: req.method,
        duration,
        requestId: req.requestId || 'unknown'
      });
    }

    next();
  } catch (error) {
    console.error('SQL injection prevention error:', error);
    
    // Log the error
    console.error(`Security check failed:`, {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: (error as Error).message,
      requestId: req.requestId || 'unknown'
    });

    // Block the request for safety
    res.status(500).json({
      success: false,
      message: 'Security check failed - request blocked',
      error: 'SECURITY_CHECK_FAILED',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      path: req.path
    });
    return;
  }
};

/**
 * Whitelist-based SQL injection prevention
 */
export const createWhitelistSqlInjectionPrevention = (allowedPatterns: RegExp[]) => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      const checkInput = (input: any): { hasInjection: boolean; field: string } => {
        if (typeof input === 'string') {
          // Check against blacklist patterns
          if (SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input))) {
            // Check if it matches any whitelist patterns
            if (!allowedPatterns.some(pattern => pattern.test(input))) {
              return { hasInjection: true, field: 'string_value' };
            }
          }
        } else if (Array.isArray(input)) {
          for (let i = 0; i < input.length; i++) {
            const result = checkInput(input[i]);
            if (result.hasInjection) {
              return { hasInjection: true, field: `array[${i}]` };
            }
          }
        } else if (input !== null && typeof input === 'object') {
          for (const [key, value] of Object.entries(input)) {
            const result = checkInput(value);
            if (result.hasInjection) {
              return { hasInjection: true, field: key };
            }
          }
        }
        
        return { hasInjection: false, field: '' };
      };

      // Check all request data
      if (req.body && checkInput(req.body).hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      if (req.query && checkInput(req.query).hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      if (req.params && checkInput(req.params).hasInjection) {
        res.status(400).json({
          success: false,
          message: 'Potential SQL injection detected',
          error: 'SQL_INJECTION_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Whitelist SQL injection prevention error:', error);
      res.status(500).json({
        success: false,
        message: 'Security check failed - request blocked',
        error: 'SECURITY_CHECK_FAILED',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
        path: req.path
      });
      return;
    }
  };
}; 