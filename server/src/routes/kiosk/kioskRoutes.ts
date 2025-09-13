import { Router } from 'express';
import kioskController from '../../controllers/kiosk/kioskController';
import { uploadSelfie, handleMulterError } from '../../config/multer';
import { kioskAuth } from '../../middleware/auth/kioskAuth';
import { validateBody, validateParams } from '../../middleware/validation/validate';
import { kioskAttendanceSchema, kioskValidateSchema, kioskParamsSchema } from '../../middleware/validation/schemas/kioskSchemas';
import { createRedisRateLimit } from '../../middleware/redis/rateLimitMiddleware';
import helmet from 'helmet';

const router = Router();

// SECURITY: Apply stricter rate limiting for kiosk endpoints to prevent abuse
const kioskRateLimit = createRedisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per 15 minutes per IP
  message: 'Too many kiosk requests, please try again later',
  keyGenerator: (req) => {
    // Use IP + User-Agent for rate limiting to prevent simple IP spoofing
    return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  }
});

// SECURITY: Apply additional security headers for kiosk endpoints
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For potential styling needs
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"], // Allow data URLs and blobs for QR codes
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Apply rate limiting and authentication to all kiosk routes
router.use(kioskRateLimit);
router.use(kioskAuth);

// Kiosk routes with proper authentication and validation
router.get('/verify-qr', kioskController.verifyEmployeeByQR);
router.post('/attendance', validateBody(kioskAttendanceSchema), kioskController.recordAttendance);
router.get('/attendance/last/:employeeId', validateParams(kioskParamsSchema), kioskController.getLastAttendance);
router.get('/attendance/history/:employeeId', validateParams(kioskParamsSchema), kioskController.getAttendanceHistory);

// Time-based attendance routes
router.get('/attendance/next-session/:employeeId', validateParams(kioskParamsSchema), kioskController.getNextExpectedSession);
router.get('/attendance/today-summary/:employeeId', validateParams(kioskParamsSchema), kioskController.getTodayAttendanceSummary);
router.post('/attendance/time-based', uploadSelfie, handleMulterError, kioskController.recordTimeBasedAttendance);
router.post('/attendance/validate', validateBody(kioskValidateSchema), kioskController.validateAttendanceAction);

export default router;
