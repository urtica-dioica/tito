import { Router } from 'express';
import { employeeController } from '../../controllers/employee/employeeController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/employee/dashboard
 * @desc Get employee dashboard data
 * @access Employee
 */
router.get('/dashboard', authorize(['employee']), employeeController.getDashboard);

/**
 * @route GET /api/v1/employee/profile
 * @desc Get employee profile
 * @access Employee
 */
router.get('/profile', authorize(['employee']), employeeController.getProfile);

/**
 * @route PUT /api/v1/employee/profile
 * @desc Update employee profile
 * @access Employee
 */
router.put('/profile', authorize(['employee']), employeeController.updateProfile);

/**
 * @route GET /api/v1/employee/attendance/history
 * @desc Get employee attendance history
 * @access Employee
 */
router.get('/attendance/history', authorize(['employee']), employeeController.getAttendanceHistory);

/**
 * @route GET /api/v1/employee/attendance/summary
 * @desc Get employee attendance summary
 * @access Employee
 */
router.get('/attendance/summary', authorize(['employee']), employeeController.getAttendanceSummary);

/**
 * @route GET /api/v1/employee/requests
 * @desc Get employee requests
 * @access Employee
 */
router.get('/requests', authorize(['employee']), employeeController.getRequests);

/**
 * @route GET /api/v1/employee/requests/stats
 * @desc Get employee request statistics
 * @access Employee
 */
router.get('/requests/stats', authorize(['employee']), employeeController.getRequestStats);

/**
 * @route GET /api/v1/employee/paystubs
 * @desc Get employee paystubs
 * @access Employee
 */
router.get('/paystubs', authorize(['employee']), employeeController.getPaystubs);

/**
 * @route GET /api/v1/employee/paystubs/latest
 * @desc Get latest employee paystub
 * @access Employee
 */
router.get('/paystubs/latest', authorize(['employee']), employeeController.getLatestPaystub);

export default router;
