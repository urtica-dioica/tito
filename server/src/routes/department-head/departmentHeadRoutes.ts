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

// Department info
router.get('/department', departmentHeadController.getDepartmentInfo);

// Employee management routes
router.get('/employees', departmentHeadController.getDepartmentEmployees);
router.get('/employees/stats', departmentHeadController.getEmployeeStats);
router.get('/employees/performance', departmentHeadController.getEmployeePerformance);
router.get('/employees/:id', departmentHeadController.getEmployeeDetails);

// Request management routes
router.get('/requests', departmentHeadController.getRequests);
router.get('/requests/pending', departmentHeadController.getPendingRequests);
router.get('/requests/history', departmentHeadController.getRequestHistory);
router.get('/requests/stats', departmentHeadController.getRequestStats);
router.post('/requests/:id/approve', departmentHeadController.approveRequest);
router.post('/requests/:id/reject', departmentHeadController.rejectRequest);

// Payroll routes
router.get('/payrolls/periods', departmentHeadController.getPayrollPeriods);
router.get('/payrolls/stats', departmentHeadController.getPayrollStats);
router.get('/payrolls/periods/:id/records', departmentHeadController.getPayrollRecords);

// Statistics and reporting routes
router.get('/stats', departmentHeadController.getDepartmentStats);
router.get('/attendance/summary', departmentHeadController.getAttendanceSummary);
router.get('/payroll/summary', departmentHeadController.getPayrollSummary);

export default router;