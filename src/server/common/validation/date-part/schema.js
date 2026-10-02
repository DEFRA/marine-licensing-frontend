import joi from 'joi'

export const DAY_PATTERN = /^\d{1,2}$/
export const MONTH_PATTERN = /^(0?[1-9]|1[0-2])$/
export const YEAR_PATTERN = /^\d{4}$/

export const datePartSchema = (pattern, requiredCode, invalidCode) =>
  joi.string().trim().required().pattern(pattern).messages({
    'string.empty': requiredCode,
    'any.required': requiredCode,
    'string.pattern.base': invalidCode
  })
