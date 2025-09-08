import Joi from 'joi';

export const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  departmentHeadUserId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional()
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional(),
  departmentHeadUserId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional()
});

export const departmentParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const departmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'name').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const assignDepartmentHeadSchema = Joi.object({
  userId: Joi.string().uuid().required()
});

export const departmentHeadsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().allow('').optional(),
  status: Joi.string().valid('active', 'inactive', '').allow('').optional()
});

export const createDepartmentHeadSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  departmentId: Joi.string().uuid().optional()
});