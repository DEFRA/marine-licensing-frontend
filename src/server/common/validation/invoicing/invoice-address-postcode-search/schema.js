import joi from 'joi'
import { UK_POSTCODE_PATTERN } from '#src/server/common/constants/regex.js'

const PROPERTY_NAME_OR_NUMBER_MAX_LENGTH = 50

export const invoiceAddressPostcodeSearchSchema = joi.object({
  postcode: joi
    .string()
    .trim()
    .pattern(UK_POSTCODE_PATTERN)
    .required()
    .messages({
      'string.empty': 'POSTCODE_REQUIRED',
      'any.required': 'POSTCODE_REQUIRED',
      'string.pattern.base': 'POSTCODE_INVALID'
    }),
  propertyNameOrNumber: joi
    .string()
    .trim()
    .max(PROPERTY_NAME_OR_NUMBER_MAX_LENGTH)
    .allow('')
    .optional()
    .messages({
      'string.max': 'PROPERTY_NAME_OR_NUMBER_MAX_LENGTH'
    })
})
