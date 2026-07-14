import joi from 'joi'

export const ukInvoiceAddressSchema = joi.object({
  addressLine1: joi.string().trim().required().messages({
    'string.empty': 'ADDRESS_LINE_1_REQUIRED',
    'any.required': 'ADDRESS_LINE_1_REQUIRED'
  }),
  addressLine2: joi.string().trim().allow('').optional(),
  addressTown: joi.string().trim().required().messages({
    'string.empty': 'ADDRESS_TOWN_REQUIRED',
    'any.required': 'ADDRESS_TOWN_REQUIRED'
  }),
  addressCounty: joi.string().trim().allow('').optional(),
  addressPostcode: joi.string().trim().required().messages({
    'string.empty': 'ADDRESS_POSTCODE_REQUIRED',
    'any.required': 'ADDRESS_POSTCODE_REQUIRED'
  })
})
