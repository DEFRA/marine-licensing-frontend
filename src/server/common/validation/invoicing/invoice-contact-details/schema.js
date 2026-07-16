import joi from 'joi'

export const invoiceContactDetailsSchema = joi.object({
  fullName: joi.string().trim().required().messages({
    'string.empty': 'INVOICING_CONTACT_FULL_NAME_REQUIRED',
    'any.required': 'INVOICING_CONTACT_FULL_NAME_REQUIRED'
  }),
  organisationName: joi.string().trim().required().messages({
    'string.empty': 'INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED',
    'any.required': 'INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED'
  }),
  phoneNumber: joi.string().trim().required().messages({
    'string.empty': 'INVOICING_CONTACT_PHONE_NUMBER_REQUIRED',
    'any.required': 'INVOICING_CONTACT_PHONE_NUMBER_REQUIRED'
  }),
  emailAddress: joi.string().trim().required().email().messages({
    'string.empty': 'INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED',
    'string.email': 'INVOICING_CONTACT_EMAIL_ADDRESS_INVALID',
    'any.required': 'INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED'
  })
})
