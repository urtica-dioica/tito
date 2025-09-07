import { Router } from 'express';
import { timeCorrectionController } from '../../controllers/attendance/timeCorrectionController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route POST /api/v1/time-corrections
 * @desc Create a time correction request
 * @access Employee
 */
router.post('/', authorize(['employee']), timeCorrectionController.createTimeCorrectionRequest);

/**
 * @route GET /api/v1/time-corrections
 * @desc List time correction requests
 * @access HR, Department Head
 * @query page, limit, employeeId, departmentId, status, sessionType, startDate, endDate, search, sortBy, sortOrder
 */
router.get('/', authorize(['hr', 'department_head']), timeCorrectionController.listTimeCorrectionRequests);

/**
 * @route GET /api/v1/time-corrections/employee
 * @desc Get employee's time correction requests
 * @access Employee
 * @query startDate, endDate, page, limit
 */
router.get('/employee', authorize(['employee']), timeCorrectionController.getEmployeeTimeCorrectionRequests);

/**
 * @route GET /api/v1/time-corrections/pending
 * @desc Get pending requests for department head
 * @access Department Head
 */
router.get('/pending', authorize(['department_head']), timeCorrectionController.getPendingRequestsForDepartmentHead);

/**
 * @route GET /api/v1/time-corrections/stats
 * @desc Get time correction statistics
 * @access HR, Department Head
 * @query employeeId, departmentId
 */
router.get('/stats', authorize(['hr', 'department_head']), timeCorrectionController.getTimeCorrectionStats);

/**
 * @route GET /api/v1/time-corrections/:id
 * @desc Get time correction request by ID
 * @access Employee, HR, Department Head
 */
router.get('/:id', authorize(['employee', 'hr', 'department_head']), timeCorrectionController.getTimeCorrectionRequest);

/**
 * @route PUT /api/v1/time-corrections/:id/approve
 * @desc Approve or reject a time correction request
 * @access Department Head
 */
router.put('/:id/approve', authorize(['department_head']), timeCorrectionController.approveTimeCorrectionRequest);

/**
 * @route DELETE /api/v1/time-corrections/:id
 * @desc Delete a time correction request
 * @access Employee (own requests only)
 */
router.delete('/:id', authorize(['employee']), timeCorrectionController.deleteTimeCorrectionRequest);

export default router;