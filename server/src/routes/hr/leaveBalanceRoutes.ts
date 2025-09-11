import { Router } from 'express';
import { leaveBalanceController } from '../../controllers/hr/leaveBalanceController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/v1/hr/leave-balances
 * @desc List all leave balances with filtering and pagination
 * @access HR
 * @query page, limit, employeeId, departmentId, leaveType, year, search, sortBy, sortOrder
 */
router.get('/', authorize(['hr']), leaveBalanceController.listLeaveBalances.bind(leaveBalanceController));

/**
 * @route GET /api/v1/hr/leave-balances/stats
 * @desc Get leave balance statistics
 * @access HR
 * @query departmentId, year
 */
router.get('/stats', authorize(['hr']), leaveBalanceController.getLeaveBalanceStats.bind(leaveBalanceController));

/**
 * @route POST /api/v1/hr/leave-balances/bulk
 * @desc Bulk create/update leave balances
 * @access HR
 */
router.post('/bulk', authorize(['hr']), leaveBalanceController.bulkUpdateLeaveBalances.bind(leaveBalanceController));

/**
 * @route POST /api/v1/hr/leave-balances/initialize
 * @desc Initialize leave balances for all employees
 * @access HR
 */
router.post('/initialize', authorize(['hr']), leaveBalanceController.initializeLeaveBalances.bind(leaveBalanceController));

/**
 * @route GET /api/v1/hr/leave-balances/employee/:employeeId
 * @desc Get employee's leave balances
 * @access HR
 * @query year
 */
router.get('/employee/:employeeId', authorize(['hr']), leaveBalanceController.getEmployeeLeaveBalances.bind(leaveBalanceController));

/**
 * @route GET /api/v1/hr/leave-balances/employees-without-balances
 * @desc Get employees without leave balances for a year
 * @access HR
 * @query year, departmentId
 */
router.get('/employees-without-balances', authorize(['hr']), leaveBalanceController.getEmployeesWithoutLeaveBalances.bind(leaveBalanceController));

/**
 * @route GET /api/v1/hr/leave-balances/templates
 * @desc Get leave balance templates by position
 * @access HR
 */
router.get('/templates', authorize(['hr']), leaveBalanceController.getLeaveBalanceTemplates.bind(leaveBalanceController));

/**
 * @route GET /api/v1/hr/leave-balances/:id
 * @desc Get leave balance by ID
 * @access HR
 */
router.get('/:id', authorize(['hr']), leaveBalanceController.getLeaveBalance.bind(leaveBalanceController));

/**
 * @route POST /api/v1/hr/leave-balances
 * @desc Create or update leave balance
 * @access HR
 */
router.post('/', authorize(['hr']), leaveBalanceController.createLeaveBalance.bind(leaveBalanceController));

/**
 * @route PUT /api/v1/hr/leave-balances/:id
 * @desc Update leave balance
 * @access HR
 */
router.put('/:id', authorize(['hr']), leaveBalanceController.updateLeaveBalance.bind(leaveBalanceController));

/**
 * @route DELETE /api/v1/hr/leave-balances/:id
 * @desc Delete leave balance
 * @access HR
 */
router.delete('/:id', authorize(['hr']), leaveBalanceController.deleteLeaveBalance.bind(leaveBalanceController));

export default router;
