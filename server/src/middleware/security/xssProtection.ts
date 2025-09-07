import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../../utils/types/express';

/**
 * XSS attack patterns
 */
const XSS_PATTERNS = [
  // Basic XSS patterns
  /<script[^>]*>.*?<\/script>/gi,
  /<script[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  /onreset\s*=/gi,
  /onselect\s*=/gi,
  /onunload\s*=/gi,
  /onabort\s*=/gi,
  /onbeforeunload\s*=/gi,
  /onhashchange\s*=/gi,
  /onmessage\s*=/gi,
  /onoffline\s*=/gi,
  /ononline\s*=/gi,
  /onpagehide\s*=/gi,
  /onpageshow\s*=/gi,
  /onpopstate\s*=/gi,
  /onresize\s*=/gi,
  /onstorage\s*=/gi,
  
  // Event handlers with spaces
  /on\s+[a-zA-Z]+\s*=/gi,
  
  // CSS expressions
  /expression\s*\(/gi,
  /url\s*\(/gi,
  
  // Data URIs
  /data:\s*text\/html/gi,
  /data:\s*text\/javascript/gi,
  /data:\s*application\/javascript/gi,
  
  // Encoded XSS
  /&#x?[0-9a-f]+;?/gi,
  /&#[0-9]+;?/gi,
  
  // Unicode XSS
  /\u003Cscript/gi,
  /\u003C/gi,
  /\u003E/gi,
  
  // Base64 encoded
  /base64/gi,
  
  // Meta refresh
  /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
  
  // Object and embed tags
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<applet[^>]*>/gi,
  
  // Iframe
  /<iframe[^>]*>/gi,
  
  // Form action
  /<form[^>]*action\s*=\s*["']?javascript:/gi,
  
  // Input value
  /<input[^>]*value\s*=\s*["']?javascript:/gi,
  
  // Anchor href
  /<a[^>]*href\s*=\s*["']?javascript:/gi,
  
  // Image src
  /<img[^>]*src\s*=\s*["']?javascript:/gi,
  
  // Style attribute
  /style\s*=\s*["'][^"']*expression\s*\(/gi,
  /style\s*=\s*["'][^"']*javascript:/gi,
  
  // Background attribute
  /background\s*=\s*["']?javascript:/gi,
  
  // Dynsrc attribute
  /dynsrc\s*=\s*["']?javascript:/gi,
  
  // Lowsrc attribute
  /lowsrc\s*=\s*["']?javascript:/gi,
  
  // Mocha attribute
  /mocha\s*=\s*["']?javascript:/gi,
  
  // Protocol handlers
  /mocha:/gi,
  /livescript:/gi,
  /vbscript:/gi,
  /javascript:/gi,
  
  // Encoded protocols
  /&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;/gi,
  /&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;/gi,
  
  // Mixed case
  /<ScRiPt/gi,
  /<sCrIpT/gi,
  /JaVaScRiPt/gi,
  
  // Null bytes
  /\x00/gi,
  
  // CRLF injection
  /\r\n/gi,
  /\r/gi,
  /\n/gi,
  
  // HTML entities
  /&lt;script/gi,
  /&gt;/gi,
  
  // URL encoded
  /%3Cscript/gi,
  /%3E/gi,
  /%3C/gi,
  
  // Double encoded
  /%253Cscript/gi,
  /%253E/gi,
  
  // UTF-7
  /\+ADw-script\+AD4-/gi,
  
  // CSS import
  /@import/gi,
  
  // CSS url
  /url\s*\(\s*["']?javascript:/gi,
  
  // CSS expression
  /expression\s*\(/gi,
  
  // CSS behavior
  /behavior\s*:\s*url/gi,
  
  // CSS binding
  /-moz-binding/gi,
  
  // CSS import with url
  /@import\s+url\s*\(\s*["']?javascript:/gi
];

/**
 * Check if a string contains XSS patterns
 */
function containsXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Recursively check object for XSS
 */
function checkObjectForXss(obj: any): { hasXss: boolean; field: string; value: string } {
  if (typeof obj === 'string') {
    if (containsXss(obj)) {
      return { hasXss: true, field: 'string_value', value: obj };
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = checkObjectForXss(obj[i]);
      if (result.hasXss) {
        return { hasXss: true, field: `array[${i}]`, value: result.value };
      }
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const result = checkObjectForXss(value);
      if (result.hasXss) {
        return { hasXss: true, field: key, value: result.value };
      }
    }
  }
  
  return { hasXss: false, field: '', value: '' };
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(input: string): string {
  return input
    // Remove script tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    
    // Remove event handlers
    .replace(/\bon[a-zA-Z]+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon[a-zA-Z]+\s*=\s*[^>\s]+/gi, '')
    
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/mocha:/gi, '')
    .replace(/livescript:/gi, '')
    
    // Remove CSS expressions
    .replace(/expression\s*\(/gi, '')
    
    // Remove data URIs
    .replace(/data:\s*text\/html/gi, '')
    .replace(/data:\s*text\/javascript/gi, '')
    .replace(/data:\s*application\/javascript/gi, '')
    
    // Remove dangerous attributes
    .replace(/\s+(on[a-zA-Z]+|javascript|vbscript|expression|background|dynsrc|lowsrc|mocha)\s*=\s*["'][^"']*["']/gi, '')
    
    // Remove dangerous tags
    .replace(/<(object|embed|applet|iframe)[^>]*>/gi, '')
    
    // Encode HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

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
 * Basic XSS protection middleware
 */
export const preventXss = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  try {
    // Check request body
    if (req.body) {
      const bodyCheck = checkObjectForXss(req.body);
      if (bodyCheck.hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in request body',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: bodyCheck.field,
            type: 'body',
            value: bodyCheck.value.substring(0, 100) // Limit value length in response
          }
        });
        return;
      }
    }

    // Check query parameters
    if (req.query) {
      const queryCheck = checkObjectForXss(req.query);
      if (queryCheck.hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in query parameters',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: queryCheck.field,
            type: 'query',
            value: queryCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Check path parameters
    if (req.params) {
      const paramsCheck = checkObjectForXss(req.params);
      if (paramsCheck.hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in path parameters',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: paramsCheck.field,
            type: 'params',
            value: paramsCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Check headers
    if (req.headers) {
      const headersCheck = checkObjectForXss(req.headers);
      if (headersCheck.hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in headers',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: headersCheck.field,
            type: 'headers',
            value: headersCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('XSS prevention error:', error);
    
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
 * XSS protection with automatic sanitization
 */
export const preventXssWithSanitization = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize path parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    // Note: Headers are typically not sanitized as they're controlled by the client

    next();
  } catch (error) {
    console.error('XSS sanitization error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Security sanitization failed - request blocked',
      error: 'SECURITY_SANITIZATION_FAILED',
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      path: req.path
    });
    return;
  }
};

/**
 * Enhanced XSS protection with logging
 */
export const preventXssWithLogging = (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
  const startTime = Date.now();
  
  try {
    // Check request body
    if (req.body) {
      const bodyCheck = checkObjectForXss(req.body);
      if (bodyCheck.hasXss) {
        // Log the attempt
        console.warn(`XSS attack attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          field: bodyCheck.field,
          value: bodyCheck.value.substring(0, 200), // Limit in logs too
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in request body',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: bodyCheck.field,
            type: 'body',
            value: bodyCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Check query parameters
    if (req.query) {
      const queryCheck = checkObjectForXss(req.query);
      if (queryCheck.hasXss) {
        console.warn(`XSS attack attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          field: queryCheck.field,
          value: queryCheck.value.substring(0, 200),
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in query parameters',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: queryCheck.field,
            type: 'query',
            value: queryCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Check path parameters
    if (req.params) {
      const paramsCheck = checkObjectForXss(req.params);
      if (paramsCheck.hasXss) {
        console.warn(`XSS attack attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          field: paramsCheck.field,
          value: paramsCheck.value.substring(0, 200),
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in path parameters',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: paramsCheck.field,
            type: 'params',
            value: paramsCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Check headers
    if (req.headers) {
      const headersCheck = checkObjectForXss(req.headers);
      if (headersCheck.hasXss) {
        console.warn(`XSS attack attempt detected:`, {
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          field: headersCheck.field,
          value: headersCheck.value.substring(0, 200),
          requestId: req.requestId || 'unknown'
        });

        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected in headers',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path,
          details: {
            field: headersCheck.field,
            type: 'headers',
            value: headersCheck.value.substring(0, 100)
          }
        });
        return;
      }
    }

    // Log successful security check
    const duration = Date.now() - startTime;
    if (duration > 100) { // Log slow security checks
      console.info(`XSS security check completed in ${duration}ms:`, {
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
    console.error('XSS prevention error:', error);
    
    // Log the error
    console.error(`XSS security check failed:`, {
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
 * Whitelist-based XSS prevention
 */
export const createWhitelistXssPrevention = (allowedPatterns: RegExp[]) => {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction): void => {
    try {
      const checkInput = (input: any): { hasXss: boolean; field: string; value: string } => {
        if (typeof input === 'string') {
          // Check against blacklist patterns
          if (XSS_PATTERNS.some(pattern => pattern.test(input))) {
            // Check if it matches any whitelist patterns
            if (!allowedPatterns.some(pattern => pattern.test(input))) {
              return { hasXss: true, field: 'string_value', value: input };
            }
          }
        } else if (Array.isArray(input)) {
          for (let i = 0; i < input.length; i++) {
            const result = checkInput(input[i]);
            if (result.hasXss) {
              return { hasXss: true, field: `array[${i}]`, value: result.value };
            }
          }
        } else if (input !== null && typeof input === 'object') {
          for (const [key, value] of Object.entries(input)) {
            const result = checkInput(value);
            if (result.hasXss) {
              return { hasXss: true, field: key, value: result.value };
            }
          }
        }
        
        return { hasXss: false, field: '', value: '' };
      };

      // Check all request data
      if (req.body && checkInput(req.body).hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      if (req.query && checkInput(req.query).hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      if (req.params && checkInput(req.params).hasXss) {
        res.status(400).json({
          success: false,
          message: 'Potential XSS attack detected',
          error: 'XSS_ATTACK_DETECTED',
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          path: req.path
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Whitelist XSS prevention error:', error);
      res.status(500).json({
        success: false,
        message: 'Security check failed - request blocked',
        error: 'SECURITY_CHECK_FAILED',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
  };
}; 