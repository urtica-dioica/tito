import { Router } from 'express';
import { departmentHeadController } from '../../controllers/department-head/departmentHeadController';
import { authenticate } from '../../middleware/auth/authenticate';
import { requireDepartmentHead } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply department head authorization to all routes
router.use(requireDepartmentHead);

// Dashboard routes
router.get('/dashboard', departmentHeadController.getDashboard);

// Employee management routes
router.get('/employees', departmentHeadController.getDepartmentEmployees);
router.get('/employees/:id', departmentHeadController.getEmployeeDetails);

// Request management routes
router.get('/requests/pending', departmentHeadController.getPendingRequests);
router.get('/requests/history', departmentHeadController.getRequestHistory);

// Statistics and reporting routes
router.get('/stats', departmentHeadController.getDepartmentStats);
router.get('/attendance/summary', departmentHeadController.getAttendanceSummary);
router.get('/payroll/summary', departmentHeadController.getPayrollSummary);

export default router;