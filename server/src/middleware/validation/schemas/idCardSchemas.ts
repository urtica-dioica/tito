import Joi from 'joi';

export const createIdCardSchema = Joi.object({
  employeeId: Joi.string().uuid().required(),
  issuedBy: Joi.string().uuid().required(),
  expiryYears: Joi.number().integer().min(1).max(10).optional()
});

export const idCardParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const idCardQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  departmentId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  isExpired: Joi.boolean().optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'issued_date', 'expiry_date').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const generateDepartmentIdCardsSchema = Joi.object({
  issuedBy: Joi.string().uuid().required()
});

export const departmentIdParamsSchema = Joi.object({
  departmentId: Joi.string().uuid().required()
});