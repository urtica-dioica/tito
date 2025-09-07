import { Router } from 'express';
import { attendanceController } from '../../controllers/attendance/attendanceController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

/**
 * @route POST /api/v1/attendance/verify-qr
 * @desc Verify QR code (for kiosk use)
 * @access Public (for kiosk)
 */
router.post('/verify-qr', attendanceController.verifyQRCode);

// Apply authentication to all other routes
router.use(authenticate);

/**
 * @route POST /api/v1/attendance/clock-in
 * @desc Clock in an employee
 * @access Employee
 */
router.post('/clock-in', authorize(['employee']), attendanceController.clockIn);

/**
 * @route POST /api/v1/attendance/clock-out
 * @desc Clock out an employee
 * @access Employee
 */
router.post('/clock-out', authorize(['employee']), attendanceController.clockOut);

/**
 * @route GET /api/v1/attendance/status
 * @desc Get current attendance status for an employee
 * @access Employee
 */
router.get('/status', authorize(['employee']), attendanceController.getCurrentStatus);

/**
 * @route GET /api/v1/attendance/summary/:date
 * @desc Get attendance summary for a specific date
 * @access Employee
 */
router.get('/summary/:date', authorize(['employee']), attendanceController.getAttendanceSummary);

/**
 * @route GET /api/v1/attendance/history
 * @desc Get attendance history for an employee
 * @access Employee
 * @query startDate, endDate, page, limit
 */
router.get('/history', authorize(['employee']), attendanceController.getAttendanceHistory);

/**
 * @route GET /api/v1/attendance/stats
 * @desc Get attendance statistics for an employee
 * @access Employee
 * @query startDate, endDate
 */
router.get('/stats', authorize(['employee']), attendanceController.getAttendanceStats);

export default router;