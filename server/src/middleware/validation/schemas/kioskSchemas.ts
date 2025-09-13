import Joi from 'joi';

// Schema for kiosk attendance recording
export const kioskAttendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'Employee ID must be a valid UUID',
    'any.required': 'Employee ID is required'
  }),
  type: Joi.string().valid('clock_in', 'clock_out', 'overtime').required().messages({
    'any.only': 'Attendance type must be clock_in, clock_out, or overtime',
    'any.required': 'Attendance type is required'
  }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters',
    'any.required': 'Location is required'
  }),
  qrCodeData: Joi.string().min(10).required().messages({
    'string.min': 'QR code data must be at least 10 characters',
    'any.required': 'QR code data is required'
  }),
  selfieUrl: Joi.string().uri().optional().messages({
    'string.uri': 'Selfie URL must be a valid URI'
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90'
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180'
  })
});

// Schema for kiosk attendance validation
export const kioskValidateSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'Employee ID must be a valid UUID',
    'any.required': 'Employee ID is required'
  }),
  sessionType: Joi.string().valid(
    'morning_in', 'morning_out', 'afternoon_in', 'afternoon_out',
    'clock_in', 'clock_out', 'overtime'
  ).required().messages({
    'any.only': 'Session type must be a valid attendance session type',
    'any.required': 'Session type is required'
  })
});

// Schema for kiosk route parameters
export const kioskParamsSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'Employee ID must be a valid UUID',
    'any.required': 'Employee ID is required'
  })
});

// Schema for time-based attendance recording
export const kioskTimeBasedAttendanceSchema = Joi.object({
  employeeId: Joi.string().uuid().required().messages({
    'string.uuid': 'Employee ID must be a valid UUID',
    'any.required': 'Employee ID is required'
  }),
  sessionType: Joi.string().valid(
    'morning_in', 'morning_out', 'afternoon_in', 'afternoon_out',
    'clock_in', 'clock_out', 'overtime'
  ).required().messages({
    'any.only': 'Session type must be a valid attendance session type',
    'any.required': 'Session type is required'
  }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location cannot exceed 100 characters',
    'any.required': 'Location is required'
  }),
  qrCodeData: Joi.string().min(10).required().messages({
    'string.min': 'QR code data must be at least 10 characters',
    'any.required': 'QR code data is required'
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90'
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180'
  })
});

// Schema for kiosk history query parameters
export const kioskHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).optional().default(10).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 50'
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.min': 'Page must be at least 1'
  })
});
