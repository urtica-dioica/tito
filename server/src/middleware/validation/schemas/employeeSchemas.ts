import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  departmentId: Joi.string().uuid().required(),
  position: Joi.string().min(2).max(100).required(),
  employmentType: Joi.string().valid('regular', 'contractual', 'jo').required(),
  hireDate: Joi.date().max('now').required(),
  baseSalary: Joi.number().positive().required(),
  password: Joi.string().min(8).optional()
});

export const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  departmentId: Joi.string().uuid().optional(),
  position: Joi.string().min(2).max(100).optional(),
  employmentType: Joi.string().valid('regular', 'contractual', 'jo').optional(),
  baseSalary: Joi.number().positive().optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'on_leave').optional()
});

export const employeeParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const employeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  departmentId: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'on_leave').optional(),
  employmentType: Joi.string().valid('regular', 'contractual', 'jo').optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'first_name', 'last_name', 'employee_id').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});