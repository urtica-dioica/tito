import { Router } from 'express';
import kioskController from '../../controllers/kiosk/kioskController';
import { uploadSelfie, handleMulterError } from '../../config/multer';

const router = Router();

// Kiosk routes (public - no authentication required for kiosk access)
router.get('/verify-qr', kioskController.verifyEmployeeByQR);
router.post('/attendance', kioskController.recordAttendance);
router.get('/attendance/last/:employeeId', kioskController.getLastAttendance);
router.get('/attendance/history/:employeeId', kioskController.getAttendanceHistory);

// Time-based attendance routes
router.get('/attendance/next-session/:employeeId', kioskController.getNextExpectedSession);
router.get('/attendance/today-summary/:employeeId', kioskController.getTodayAttendanceSummary);
router.post('/attendance/time-based', uploadSelfie, handleMulterError, kioskController.recordTimeBasedAttendance);
router.post('/attendance/validate', kioskController.validateAttendanceAction);

export default router;
