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
 * @route GET /api/v1/payroll/records/export
 * @desc Export payroll records
 * @access HR Admin
 */
router.get('/records/export', authorize(['hr']), payrollController.exportPayrollRecords.bind(payrollController));

/**
 * @route GET /api/v1/payroll/records/:id
 * @desc Get payroll record by ID
 * @access HR Admin
 */
router.get('/records/:id', authorize(['hr']), payrollController.getPayrollRecord.bind(payrollController));

/**
 * @route GET /api/v1/payroll/stats
 * @desc Get payroll statistics
 * @access HR Admin
 */
router.get('/stats', authorize(['hr']), payrollController.getPayrollStats.bind(payrollController));

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

// ===== NEW PAYROLL SYSTEM ROUTES =====

// New routes for benefit types management
/**
 * @route POST /api/v1/payroll/benefit-types
 * @desc Create a new benefit type
 * @access HR Admin
 */
router.post('/benefit-types', authorize(['hr']), payrollController.createBenefitType.bind(payrollController));

/**
 * @route GET /api/v1/payroll/benefit-types
 * @desc Get all benefit types
 * @access HR Admin
 */
router.get('/benefit-types', authorize(['hr']), payrollController.getBenefitTypes.bind(payrollController));

/**
 * @route PUT /api/v1/payroll/benefit-types/:id
 * @desc Update benefit type
 * @access HR Admin
 */
router.put('/benefit-types/:id', authorize(['hr']), payrollController.updateBenefitType.bind(payrollController));

/**
 * @route DELETE /api/v1/payroll/benefit-types/:id
 * @desc Delete benefit type
 * @access HR Admin
 */
router.delete('/benefit-types/:id', authorize(['hr']), payrollController.deleteBenefitType.bind(payrollController));

// New routes for employee deduction balances management
/**
 * @route GET /api/v1/payroll/employee-deduction-balances
 * @desc Get employee deduction balances
 * @access HR Admin
 */
router.get('/employee-deduction-balances', authorize(['hr']), payrollController.getEmployeeDeductionBalances.bind(payrollController));

/**
 * @route POST /api/v1/payroll/employee-deduction-balances
 * @desc Create employee deduction balance
 * @access HR Admin
 */
router.post('/employee-deduction-balances', authorize(['hr']), payrollController.createEmployeeDeductionBalance.bind(payrollController));

/**
 * @route POST /api/v1/payroll/employee-deduction-balances/upload
 * @desc Upload employee deduction balances from CSV
 * @access HR Admin
 */
router.post('/employee-deduction-balances/upload', authorize(['hr']), payrollController.uploadEmployeeDeductionBalances.bind(payrollController));

/**
 * @route DELETE /api/v1/payroll/employee-deduction-balances/:id
 * @desc Delete employee deduction balance
 * @access HR Admin
 */
router.delete('/employee-deduction-balances/:id', authorize(['hr']), payrollController.deleteEmployeeDeductionBalance.bind(payrollController));

// New routes for employee benefits management
/**
 * @route GET /api/v1/payroll/employee-benefits
 * @desc Get employee benefits
 * @access HR Admin
 */
router.get('/employee-benefits', authorize(['hr']), payrollController.getEmployeeBenefits.bind(payrollController));

/**
 * @route POST /api/v1/payroll/employee-benefits
 * @desc Create employee benefit
 * @access HR Admin
 */
router.post('/employee-benefits', authorize(['hr']), payrollController.createEmployeeBenefit.bind(payrollController));

/**
 * @route POST /api/v1/payroll/employee-benefits/upload
 * @desc Upload employee benefits from CSV
 * @access HR Admin
 */
router.post('/employee-benefits/upload', authorize(['hr']), payrollController.uploadEmployeeBenefits.bind(payrollController));

/**
 * @route PUT /api/v1/payroll/employee-benefits/:id
 * @desc Update employee benefit
 * @access HR Admin
 */
router.put('/employee-benefits/:id', authorize(['hr']), payrollController.updateEmployeeBenefit.bind(payrollController));

/**
 * @route DELETE /api/v1/payroll/employee-benefits/:id
 * @desc Delete employee benefit
 * @access HR Admin
 */
router.delete('/employee-benefits/:id', authorize(['hr']), payrollController.deleteEmployeeBenefit.bind(payrollController));

/**
 * @route POST /api/v1/payroll/initialize-periods
 * @desc Initialize payroll periods for the current year
 * @access HR Admin
 */
router.post('/initialize-periods', authorize(['hr']), payrollController.initializePayrollPeriods.bind(payrollController));

/**
 * @route POST /api/v1/payroll/generate-current-month
 * @desc Generate payroll period for the current month only
 * @access HR Admin
 */
router.post('/generate-current-month', authorize(['hr']), payrollController.generateCurrentMonthPeriod.bind(payrollController));

/**
 * @route GET /api/v1/payroll/expected-hours
 * @desc Get expected monthly hours from system settings
 * @access HR Admin
 */
router.get('/expected-hours', authorize(['hr']), payrollController.getExpectedMonthlyHours.bind(payrollController));

/**
 * @route GET /api/v1/payroll/paystubs/department/:departmentId/period/:periodId
 * @desc Generate PDF paystubs for a department's employees for a specific period
 * @access HR Admin
 */
router.get('/paystubs/department/:departmentId/period/:periodId', authorize(['hr']), payrollController.generateDepartmentPaystubs.bind(payrollController));

export default router;