import Joi from 'joi';

export const createEmployeeSchema = Joi.object({
  user_id: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required'
  }),
  department_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Department ID must be a valid UUID'
  }),
  position: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Position must be at least 2 characters long',
    'string.max': 'Position must not exceed 100 characters',
    'any.required': 'Position is required'
  }),
  employment_type: Joi.string().valid('regular', 'contractual', 'jo').required().messages({
    'any.only': 'Employment type must be one of: regular, contractual, jo',
    'any.required': 'Employment type is required'
  }),
  hire_date: Joi.date().max('now').required().messages({
    'date.max': 'Hire date cannot be in the future',
    'any.required': 'Hire date is required'
  }),
  base_salary: Joi.number().positive().min(10000).max(1000000).required().messages({
    'number.base': 'Base salary must be a number',
    'number.positive': 'Base salary must be positive',
    'number.min': 'Base salary must be at least 10,000',
    'number.max': 'Base salary cannot exceed 1,000,000',
    'any.required': 'Base salary is required'
  }),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'on_leave').default('active').messages({
    'any.only': 'Status must be one of: active, inactive, terminated, on_leave'
  })
});

export const updateEmployeeSchema = Joi.object({
  department_id: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Department ID must be a valid UUID'
  }),
  position: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Position must be at least 2 characters long',
    'string.max': 'Position must not exceed 100 characters'
  }),
  employment_type: Joi.string().valid('regular', 'contractual', 'jo').optional().messages({
    'any.only': 'Employment type must be one of: regular, contractual, jo'
  }),
  hire_date: Joi.date().max('now').optional().messages({
    'date.max': 'Hire date cannot be in the future'
  }),
  base_salary: Joi.number().positive().min(10000).max(1000000).optional().messages({
    'number.base': 'Base salary must be a number',
    'number.positive': 'Base salary must be positive',
    'number.min': 'Base salary must be at least 10,000',
    'number.max': 'Base salary cannot exceed 1,000,000'
  }),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'on_leave').optional().messages({
    'any.only': 'Status must be one of: active, inactive, terminated, on_leave'
  })
});

export const employeeIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Employee ID must be a valid UUID',
    'any.required': 'Employee ID is required'
  })
});

export const employeeUserIdSchema = Joi.object({
  user_id: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required'
  })
});

export const employeeEmployeeIdSchema = Joi.object({
  employee_id: Joi.string().pattern(/^EMP\d{6}$/).required().messages({
    'string.pattern.base': 'Employee ID must be in format EMP000000',
    'any.required': 'Employee ID is required'
  })
});

export const listEmployeesSchema = Joi.object({
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
  department_id: Joi.string().uuid().optional().messages({
    'string.guid': 'Department ID must be a valid UUID'
  }),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'on_leave').optional().messages({
    'any.only': 'Status must be one of: active, inactive, terminated, on_leave'
  }),
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character',
    'string.max': 'Search term cannot exceed 100 characters'
  })
}); 