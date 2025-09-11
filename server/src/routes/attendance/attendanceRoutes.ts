import { Router } from 'express';
import { attendanceController } from '../../controllers/attendance/attendanceController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

// Get recent attendance records for dashboard
router.get('/recent', authenticate, authorize(['hr', 'admin']), attendanceController.getRecentAttendance.bind(attendanceController));

// Get attendance statistics for dashboard
router.get('/stats', authenticate, authorize(['hr', 'admin']), attendanceController.getAttendanceStats.bind(attendanceController));

// Get daily attendance records for dashboard
router.get('/daily', authenticate, authorize(['hr', 'admin']), attendanceController.getDailyAttendance.bind(attendanceController));

// Get all sessions for an attendance record
router.get('/record/:id/sessions', authenticate, authorize(['hr', 'admin']), attendanceController.getAttendanceRecordSessions.bind(attendanceController));

// Get detailed attendance record by ID
router.get('/:id', authenticate, authorize(['hr', 'admin']), attendanceController.getAttendanceDetail.bind(attendanceController));

export default router;