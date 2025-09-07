import { Router } from 'express';
import { overtimeController } from '../../controllers/attendance/overtimeController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route POST /api/v1/overtime
 * @desc Create an overtime request
 * @access Employee
 */
router.post('/', authorize(['employee']), overtimeController.createOvertimeRequest);

/**
 * @route GET /api/v1/overtime
 * @desc List overtime requests
 * @access HR, Department Head
 * @query page, limit, employeeId, departmentId, status, startDate, endDate, search, sortBy, sortOrder
 */
router.get('/', authorize(['hr', 'department_head']), overtimeController.listOvertimeRequests);

/**
 * @route GET /api/v1/overtime/employee
 * @desc Get employee's overtime requests
 * @access Employee
 * @query startDate, endDate, page, limit
 */
router.get('/employee', authorize(['employee']), overtimeController.getEmployeeOvertimeRequests);

/**
 * @route GET /api/v1/overtime/pending
 * @desc Get pending requests for department head
 * @access Department Head
 */
router.get('/pending', authorize(['department_head']), overtimeController.getPendingRequestsForDepartmentHead);

/**
 * @route GET /api/v1/overtime/stats
 * @desc Get overtime statistics
 * @access HR, Department Head
 * @query employeeId, departmentId
 */
router.get('/stats', authorize(['hr', 'department_head']), overtimeController.getOvertimeStats);

/**
 * @route GET /api/v1/overtime/summary
 * @desc Get employee overtime summary
 * @access Employee
 * @query startDate, endDate
 */
router.get('/summary', authorize(['employee']), overtimeController.getEmployeeOvertimeSummary);

/**
 * @route GET /api/v1/overtime/:id
 * @desc Get overtime request by ID
 * @access Employee, HR, Department Head
 */
router.get('/:id', authorize(['employee', 'hr', 'department_head']), overtimeController.getOvertimeRequest);

/**
 * @route PUT /api/v1/overtime/:id/approve
 * @desc Approve or reject an overtime request
 * @access Department Head
 */
router.put('/:id/approve', authorize(['department_head']), overtimeController.approveOvertimeRequest);

/**
 * @route DELETE /api/v1/overtime/:id
 * @desc Delete an overtime request
 * @access Employee (own requests only)
 */
router.delete('/:id', authorize(['employee']), overtimeController.deleteOvertimeRequest);

export default router;