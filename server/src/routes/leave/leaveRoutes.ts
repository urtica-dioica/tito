import { Router } from 'express';
import { leaveController } from '../../controllers/leave/leaveController';
import { LeaveAccrualController } from '../../controllers/leave/leaveAccrualController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();
const leaveAccrualController = new LeaveAccrualController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route POST /api/v1/leaves
 * @desc Create a leave request
 * @access Employee
 */
router.post('/', authorize(['employee']), leaveController.createLeaveRequest);

/**
 * @route GET /api/v1/leaves
 * @desc List leave requests
 * @access HR, Department Head
 * @query page, limit, employeeId, departmentId, leaveType, status, startDate, endDate, search, sortBy, sortOrder
 */
router.get('/', authorize(['hr', 'department_head']), leaveController.listLeaveRequests);

/**
 * @route GET /api/v1/leaves/employee
 * @desc Get employee's leave requests
 * @access Employee
 * @query startDate, endDate, page, limit
 */
router.get('/employee', authorize(['employee']), leaveController.getEmployeeLeaveRequests);

/**
 * @route GET /api/v1/leaves/balance
 * @desc Get employee's leave balance
 * @access Employee
 * @query year
 */
router.get('/balance', authorize(['employee']), leaveController.getEmployeeLeaveBalance);

/**
 * @route GET /api/v1/leaves/calendar/:year
 * @desc Get employee's leave calendar for a year
 * @access Employee
 */
router.get('/calendar/:year', authorize(['employee']), leaveController.getEmployeeLeaveCalendar);

/**
 * @route GET /api/v1/leaves/pending
 * @desc Get pending requests for department head
 * @access Department Head
 */
router.get('/pending', authorize(['department_head']), leaveController.getPendingRequestsForDepartmentHead);

/**
 * @route GET /api/v1/leaves/stats
 * @desc Get leave statistics
 * @access HR, Department Head
 * @query employeeId, departmentId
 */
router.get('/stats', authorize(['hr', 'department_head']), leaveController.getLeaveStats);

/**
 * @route POST /api/v1/leaves/initialize-balance
 * @desc Initialize leave balance for an employee
 * @access HR
 */
router.post('/initialize-balance', authorize(['hr']), leaveController.initializeEmployeeLeaveBalance);

/**
 * @route GET /api/v1/leaves/:id
 * @desc Get leave request by ID
 * @access Employee, HR, Department Head
 */
router.get('/:id', authorize(['employee', 'hr', 'department_head']), leaveController.getLeaveRequest);

/**
 * @route PUT /api/v1/leaves/:id/approve
 * @desc Approve or reject a leave request
 * @access Department Head
 */
router.put('/:id/approve', authorize(['department_head']), leaveController.approveLeaveRequest);

/**
 * @route DELETE /api/v1/leaves/:id
 * @desc Delete a leave request
 * @access Employee (own requests only)
 */
router.delete('/:id', authorize(['employee']), leaveController.deleteLeaveRequest);

// ===== LEAVE ACCRUAL ROUTES =====

/**
 * @route POST /api/v1/leaves/accruals
 * @desc Create a leave accrual
 * @access HR Admin
 */
router.post('/accruals', authorize(['hr']), leaveAccrualController.createLeaveAccrual.bind(leaveAccrualController));

/**
 * @route GET /api/v1/leaves/accruals
 * @desc List leave accruals
 * @access HR Admin
 */
router.get('/accruals', authorize(['hr']), leaveAccrualController.listLeaveAccruals.bind(leaveAccrualController));

/**
 * @route GET /api/v1/leaves/accruals/stats
 * @desc Get leave accrual statistics
 * @access HR Admin
 */
router.get('/accruals/stats', authorize(['hr']), leaveAccrualController.getLeaveAccrualStats.bind(leaveAccrualController));

/**
 * @route GET /api/v1/leaves/accruals/:id
 * @desc Get leave accrual by ID
 * @access HR Admin, Employee (own accruals)
 */
router.get('/accruals/:id', authorize(['hr', 'employee']), leaveAccrualController.getLeaveAccrual.bind(leaveAccrualController));

/**
 * @route GET /api/v1/leaves/accruals/employee/:employeeId
 * @desc Get employee's leave accruals
 * @access HR Admin, Employee (own accruals)
 */
router.get('/accruals/employee/:employeeId', authorize(['hr', 'employee']), leaveAccrualController.getEmployeeLeaveAccruals.bind(leaveAccrualController));

/**
 * @route GET /api/v1/leaves/accruals/employee/:employeeId/summary
 * @desc Get employee's accrual summary
 * @access HR Admin, Employee (own summary)
 */
router.get('/accruals/employee/:employeeId/summary', authorize(['hr', 'employee']), leaveAccrualController.getEmployeeAccrualSummary.bind(leaveAccrualController));

/**
 * @route POST /api/v1/leaves/accruals/process-overtime
 * @desc Process overtime to leave accrual (DEPRECATED - Feature disabled 2025-09-14)
 * @access HR Admin
 * @deprecated This endpoint is deprecated. Overtime-to-leave conversion has been removed.
 */
router.post('/accruals/process-overtime', authorize(['hr']), leaveAccrualController.processOvertimeToLeaveAccrual.bind(leaveAccrualController));

/**
 * @route POST /api/v1/leaves/accruals/process-bulk
 * @desc Process bulk overtime accruals (DEPRECATED - Feature disabled 2025-09-14)
 * @access HR Admin
 * @deprecated This endpoint is deprecated. Overtime-to-leave conversion has been removed.
 */
router.post('/accruals/process-bulk', authorize(['hr']), leaveAccrualController.processBulkOvertimeAccruals.bind(leaveAccrualController));

/**
 * @route POST /api/v1/leaves/accruals/employee/:employeeId/recalculate
 * @desc Recalculate employee accruals
 * @access HR Admin
 */
router.post('/accruals/employee/:employeeId/recalculate', authorize(['hr']), leaveAccrualController.recalculateEmployeeAccruals.bind(leaveAccrualController));

/**
 * @route DELETE /api/v1/leaves/accruals/:id
 * @desc Delete a leave accrual
 * @access HR Admin
 */
router.delete('/accruals/:id', authorize(['hr']), leaveAccrualController.deleteLeaveAccrual.bind(leaveAccrualController));

export default router;