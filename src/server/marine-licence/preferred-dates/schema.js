import joi from 'joi'

const monthSchema = (requiredCode, invalidCode) =>
  joi
    .string()
    .required()
    .pattern(/^(0?[1-9]|1[0-2])$/)
    .messages({
      'string.empty': requiredCode,
      'any.required': requiredCode,
      'string.pattern.base': invalidCode
    })

const yearSchema = (requiredCode, invalidCode) =>
  joi
    .string()
    .required()
    .pattern(/^\d{4}$/)
    .messages({
      'string.empty': requiredCode,
      'any.required': requiredCode,
      'string.pattern.base': invalidCode
    })

export const preferredDatesSchema = joi.object({
  'start-date-month': monthSchema(
    'PREFERRED_START_MONTH_REQUIRED',
    'PREFERRED_START_MONTH_INVALID'
  ),
  'start-date-year': yearSchema(
    'PREFERRED_START_YEAR_REQUIRED',
    'PREFERRED_START_YEAR_INVALID'
  ),
  'end-date-month': monthSchema(
    'PREFERRED_END_MONTH_REQUIRED',
    'PREFERRED_END_MONTH_INVALID'
  ),
  'end-date-year': yearSchema(
    'PREFERRED_END_YEAR_REQUIRED',
    'PREFERRED_END_YEAR_INVALID'
  )
})
