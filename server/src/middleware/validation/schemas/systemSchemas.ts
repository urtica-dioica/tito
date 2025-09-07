import Joi from 'joi';

export const createSystemSettingSchema = Joi.object({
  settingKey: Joi.string().min(1).max(100).required(),
  settingValue: Joi.string().required(),
  dataType: Joi.string().valid('number', 'boolean', 'string', 'decimal').required(),
  description: Joi.string().max(500).optional()
});

export const updateSystemSettingSchema = Joi.object({
  settingValue: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
  isActive: Joi.boolean().optional()
});

export const systemSettingParamsSchema = Joi.object({
  key: Joi.string().min(1).max(100).required()
});