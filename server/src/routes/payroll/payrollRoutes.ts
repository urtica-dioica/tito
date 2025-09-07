import { Router } from 'express';
import { payrollController } from '../../controllers/payroll/payrollController';
import { deductionTypeController } from '../../controllers/payroll/deductionTypeController';
import { PayrollApprovalController } from '../../controllers/payroll/payrollApprovalController';
import { authenticate } from '../../middleware/auth/authenticate';
import { authorize } from '../../middleware/auth/authorize';

const router = Router();
const payrollApprovalController = new PayrollApprovalController();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route POST /api/v1/payroll/periods
 * @desc Create a new payroll period
 * @access HR Admin
 */
router.post('/periods', authorize(['hr']), payrollController.createPayrollPeriod.bind(payrollController));

/**
 * @route GET /api/v1/payroll/periods
 * @desc Get all payroll periods
 * @access HR Admin
 */
router.get('/periods', authorize(['hr']), payrollController.getPayrollPeriods.bind(payrollController));

/**
 * @route GET /api/v1/payroll/periods/:id
 * @desc Get payroll period by ID
 * @access HR Admin
 */
router.get('/periods/:id', authorize(['hr']), payrollController.getPayrollPeriod.bind(payrollController));

/**
 * @route PUT /api/v1/payroll/periods/:id
 * @desc Update payroll period
 * @access HR Admin
 */
router.put('/periods/:id', authorize(['hr']), payrollController.updatePayrollPeriod.bind(payrollController));

/**
 * @route DELETE /api/v1/payroll/periods/:id
 * @desc Delete payroll period
 * @access HR Admin
 */
router.delete('/periods/:id', authorize(['hr']), payrollController.deletePayrollPeriod.bind(payrollController));

/**
 * @route POST /api/v1/payroll/periods/:id/generate
 * @desc Generate payroll records for a period
 * @access HR Admin
 */
router.post('/periods/:id/generate', authorize(['hr']), payrollController.generatePayrollRecords.bind(payrollController));

/**
 * @route GET /api/v1/payroll/periods/:id/summary
 * @desc Get payroll period summary
 * @access HR Admin
 */
router.get('/periods/:id/summary', authorize(['hr']), payrollController.getPayrollSummary.bind(payrollController));

/**
 * @route GET /api/v1/payroll/records
 * @desc Get payroll records
 * @access HR Admin
 */
router.get('/records', authorize(['hr']), payrollController.getPayrollRecords.bind(payrollController));

/**
 * @route GET /api/v1/payroll/records/:id
 * @desc Get payroll record by ID
 * @access HR Admin
 */
router.get('/records/:id', authorize(['hr']), payrollController.getPayrollRecord.bind(payrollController));

/**
 * @route PUT /api/v1/payroll/records/:id
 * @desc Update payroll record
 * @access HR Admin
 */
router.put('/records/:id', authorize(['hr']), payrollController.updatePayrollRecord.bind(payrollController));

/**
 * @route POST /api/v1/payroll/records/:id/approve
 * @desc Approve payroll record
 * @access HR Admin
 */
router.post('/records/:id/approve', authorize(['hr']), payrollController.approvePayrollRecord.bind(payrollController));

/**
 * @route POST /api/v1/payroll/records/:id/mark-paid
 * @desc Mark payroll record as paid
 * @access HR Admin
 */
router.post('/records/:id/mark-paid', authorize(['hr']), payrollController.markPayrollAsPaid.bind(payrollController));

/**
 * @route POST /api/v1/payroll/deduction-types
 * @desc Create a new deduction type
 * @access HR Admin
 */
router.post('/deduction-types', authorize(['hr']), deductionTypeController.createDeductionType.bind(deductionTypeController));

/**
 * @route GET /api/v1/payroll/deduction-types
 * @desc Get all deduction types
 * @access HR Admin
 */
router.get('/deduction-types', authorize(['hr']), deductionTypeController.getDeductionTypes.bind(deductionTypeController));

/**
 * @route GET /api/v1/payroll/deduction-types/active
 * @desc Get active deduction types
 * @access HR Admin
 */
router.get('/deduction-types/active', authorize(['hr']), deductionTypeController.getActiveDeductionTypes.bind(deductionTypeController));

/**
 * @route GET /api/v1/payroll/deduction-types/:id
 * @desc Get deduction type by ID
 * @access HR Admin
 */
router.get('/deduction-types/:id', authorize(['hr']), deductionTypeController.getDeductionType.bind(deductionTypeController));

/**
 * @route PUT /api/v1/payroll/deduction-types/:id
 * @desc Update deduction type
 * @access HR Admin
 */
router.put('/deduction-types/:id', authorize(['hr']), deductionTypeController.updateDeductionType.bind(deductionTypeController));

/**
 * @route DELETE /api/v1/payroll/deduction-types/:id
 * @desc Delete deduction type
 * @access HR Admin
 */
router.delete('/deduction-types/:id', authorize(['hr']), deductionTypeController.deleteDeductionType.bind(deductionTypeController));

/**
 * @route POST /api/v1/payroll/deduction-types/:id/activate
 * @desc Activate deduction type
 * @access HR Admin
 */
router.post('/deduction-types/:id/activate', authorize(['hr']), deductionTypeController.activateDeductionType.bind(deductionTypeController));

/**
 * @route POST /api/v1/payroll/deduction-types/:id/deactivate
 * @desc Deactivate deduction type
 * @access HR Admin
 */
router.post('/deduction-types/:id/deactivate', authorize(['hr']), deductionTypeController.deactivateDeductionType.bind(deductionTypeController));

// ===== PAYROLL APPROVAL ROUTES =====

/**
 * @route POST /api/v1/payroll/approvals
 * @desc Create a new payroll approval
 * @access HR Admin
 */
router.post('/approvals', authorize(['hr']), payrollApprovalController.createPayrollApproval.bind(payrollApprovalController));

/**
 * @route GET /api/v1/payroll/approvals
 * @desc Get all payroll approvals
 * @access HR Admin
 */
router.get('/approvals', authorize(['hr']), payrollApprovalController.listPayrollApprovals.bind(payrollApprovalController));

/**
 * @route GET /api/v1/payroll/approvals/stats
 * @desc Get payroll approval statistics
 * @access HR Admin
 */
router.get('/approvals/stats', authorize(['hr']), payrollApprovalController.getPayrollApprovalStats.bind(payrollApprovalController));

/**
 * @route GET /api/v1/payroll/approvals/:id
 * @desc Get payroll approval by ID
 * @access HR Admin, Department Head
 */
router.get('/approvals/:id', authorize(['hr', 'department_head']), payrollApprovalController.getPayrollApproval.bind(payrollApprovalController));

/**
 * @route GET /api/v1/payroll/approvals/approver/:approverId/pending
 * @desc Get pending approvals for a specific approver
 * @access HR Admin, Department Head
 */
router.get('/approvals/approver/:approverId/pending', authorize(['hr', 'department_head']), payrollApprovalController.getPendingApprovalsForApprover.bind(payrollApprovalController));

/**
 * @route PUT /api/v1/payroll/approvals/:id/approve
 * @desc Approve or reject a payroll approval
 * @access HR Admin, Department Head
 */
router.put('/approvals/:id/approve', authorize(['hr', 'department_head']), payrollApprovalController.approvePayrollApproval.bind(payrollApprovalController));

/**
 * @route POST /api/v1/payroll/periods/:payrollPeriodId/approvals
 * @desc Create approvals for a payroll period
 * @access HR Admin
 */
router.post('/periods/:payrollPeriodId/approvals', authorize(['hr']), payrollApprovalController.createApprovalsForPayrollPeriod.bind(payrollApprovalController));

/**
 * @route GET /api/v1/payroll/periods/:payrollPeriodId/approvals/workflow
 * @desc Get approval workflow status for a payroll period
 * @access HR Admin
 */
router.get('/periods/:payrollPeriodId/approvals/workflow', authorize(['hr']), payrollApprovalController.getApprovalWorkflowStatus.bind(payrollApprovalController));

/**
 * @route DELETE /api/v1/payroll/approvals/:id
 * @desc Delete a payroll approval
 * @access HR Admin
 */
router.delete('/approvals/:id', authorize(['hr']), payrollApprovalController.deletePayrollApproval.bind(payrollApprovalController));

export default router;