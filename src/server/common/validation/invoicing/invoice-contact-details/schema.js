import { PHONE_NUMBER_PATTERN } from '#src/server/common/constants/regex.js'

import joi from 'joi'

const FULL_NAME_MAX_LENGTH = 100
const ORGANISATION_MAX_LENGTH = 100
const EMAIL_MAX_LENGTH = 254

export const invoiceContactDetailsSchema = joi.object({
  fullName: joi.string().trim().required().max(FULL_NAME_MAX_LENGTH).messages({
    'string.empty': 'INVOICING_CONTACT_FULL_NAME_REQUIRED',
    'string.max': 'INVOICING_CONTACT_FULL_NAME_MAX_LENGTH',
    'any.required': 'INVOICING_CONTACT_FULL_NAME_REQUIRED'
  }),
  organisationName: joi
    .string()
    .trim()
    .required()
    .max(ORGANISATION_MAX_LENGTH)
    .messages({
      'string.empty': 'INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED',
      'string.max': 'INVOICING_CONTACT_ORGANISATION_NAME_MAX_LENGTH',
      'any.required': 'INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED'
    }),
  phoneNumber: joi
    .string()
    .trim()
    .required()
    .pattern(PHONE_NUMBER_PATTERN)
    .messages({
      'string.empty': 'INVOICING_CONTACT_PHONE_NUMBER_REQUIRED',
      'string.pattern.base': 'INVOICING_CONTACT_PHONE_NUMBER_INVALID',
      'any.required': 'INVOICING_CONTACT_PHONE_NUMBER_REQUIRED'
    }),
  emailAddress: joi
    .string()
    .trim()
    .required()
    .max(EMAIL_MAX_LENGTH)
    .email()
    .messages({
      'string.empty': 'INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED',
      'string.email': 'INVOICING_CONTACT_EMAIL_ADDRESS_INVALID',
      'string.max': 'INVOICING_CONTACT_EMAIL_ADDRESS_MAX_LENGTH',
      'any.required': 'INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED'
    })
})
