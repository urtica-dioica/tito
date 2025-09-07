import Joi from 'joi';

export const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Department name must be at least 2 characters long',
    'string.max': 'Department name must not exceed 100 characters',
    'any.required': 'Department name is required'
  }),
  description: Joi.string().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters'
  }),
  department_head_user_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Department head user ID must be a valid UUID'
  }),
  is_active: Joi.boolean().default(true).messages({
    'boolean.base': 'Is active must be a boolean'
  })
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Department name must be at least 2 characters long',
    'string.max': 'Department name must not exceed 100 characters'
  }),
  description: Joi.string().max(500).allow(null, '').optional().messages({
    'string.max': 'Description must not exceed 500 characters'
  }),
  department_head_user_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Department head user ID must be a valid UUID'
  }),
  is_active: Joi.boolean().optional().messages({
    'boolean.base': 'Is active must be a boolean'
  })
});

export const departmentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Department ID must be a valid UUID',
    'any.required': 'Department ID is required'
  })
});

export const departmentNameSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Department name must be at least 2 characters long',
    'string.max': 'Department name must not exceed 100 characters',
    'string.empty': 'Department name cannot be empty',
    'any.required': 'Department name is required'
  })
});

export const assignDepartmentHeadSchema = Joi.object({
  department_id: Joi.string().uuid().required().messages({
    'string.guid': 'Department ID must be a valid UUID',
    'any.required': 'Department ID is required'
  }),
  user_id: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required'
  })
});

export const listDepartmentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  is_active: Joi.boolean().optional().messages({
    'boolean.base': 'Is active must be a boolean'
  }),
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character',
    'string.max': 'Search term cannot exceed 100 characters'
  }),
  has_head: Joi.boolean().optional().messages({
    'boolean.base': 'Has head must be a boolean'
  })
}); 