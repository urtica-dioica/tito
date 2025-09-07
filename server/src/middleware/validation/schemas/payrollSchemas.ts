import Joi from 'joi';

// Payroll Period Schemas
export const createPayrollPeriodSchema = Joi.object({
  period_name: Joi.string().required().min(1).max(100),
  start_date: Joi.date().required(),
  end_date: Joi.date().required().greater(Joi.ref('start_date')),
  status: Joi.string().valid('draft', 'processing', 'sent_for_review', 'completed').optional()
});

export const updatePayrollPeriodSchema = Joi.object({
  period_name: Joi.string().min(1).max(100).optional(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  status: Joi.string().valid('draft', 'processing', 'sent_for_review', 'completed').optional()
});

export const payrollPeriodQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('draft', 'processing', 'sent_for_review', 'completed').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

// Payroll Record Schemas
export const updatePayrollRecordSchema = Joi.object({
  base_salary: Joi.number().positive().optional(),
  regular_hours: Joi.number().positive().optional(),
  hourly_rate: Joi.number().positive().optional(),
  regular_pay: Joi.number().min(0).optional(),
  overtime_hours: Joi.number().min(0).optional(),
  overtime_pay: Joi.number().min(0).optional(),
  total_pay: Joi.number().min(0).optional(),
  net_pay: Joi.number().min(0).optional(),
  status: Joi.string().valid('draft', 'processed', 'paid').optional()
});

export const payrollRecordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  payroll_period_id: Joi.string().uuid().optional(),
  employee_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('draft', 'processed', 'paid').optional()
});

// Deduction Type Schemas
export const createDeductionTypeSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500).optional().allow(null),
  percentage: Joi.number().min(0).max(100).optional().allow(null),
  fixed_amount: Joi.number().min(0).optional().allow(null),
  is_active: Joi.boolean().optional()
}).custom((value, helpers) => {
  // Either percentage or fixed_amount must be provided, but not both
  if (!value.percentage && !value.fixed_amount) {
    return helpers.error('custom.eitherPercentageOrFixed');
  }
  if (value.percentage && value.fixed_amount) {
    return helpers.error('custom.notBothPercentageAndFixed');
  }
  return value;
}).messages({
  'custom.eitherPercentageOrFixed': 'Either percentage or fixed amount must be provided',
  'custom.notBothPercentageAndFixed': 'Cannot specify both percentage and fixed amount'
});

export const updateDeductionTypeSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional().allow(null),
  percentage: Joi.number().min(0).max(100).optional().allow(null),
  fixed_amount: Joi.number().min(0).optional().allow(null),
  is_active: Joi.boolean().optional()
});

export const deductionTypeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  is_active: Joi.boolean().optional()
});

// Payroll Calculation Schemas
export const calculatePayrollSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  payroll_period_id: Joi.string().uuid().required(),
  base_salary: Joi.number().positive().required(),
  regular_hours: Joi.number().min(0).required(),
  overtime_hours: Joi.number().min(0).required(),
  deductions: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      percentage: Joi.number().min(0).max(100).optional()
    })
  ).optional()
});

// Payroll Approval Schemas
export const approvePayrollSchema = Joi.object({
  comments: Joi.string().max(500).optional()
});

// Payroll Summary Query Schema
export const payrollSummaryQuerySchema = Joi.object({
  include_details: Joi.boolean().optional(),
  group_by_department: Joi.boolean().optional()
});