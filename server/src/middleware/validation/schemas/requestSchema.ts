import Joi from 'joi';

export const requestQuerySchema = Joi.object({
  type: Joi.string().valid('time_correction', 'overtime', 'leave').optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  departmentId: Joi.string().uuid().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const requestParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const requestActionSchema = Joi.object({
  reason: Joi.string().optional(),
});
