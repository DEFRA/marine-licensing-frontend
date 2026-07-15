import joi from 'joi'

export const isInvoiceAddressUkOrInternationalSchema = joi.object({
  invoiceAddressType: joi
    .string()
    .valid('uk', 'international')
    .required()
    .messages({
      'any.only': 'INVOICE_ADDRESS_TYPE_REQUIRED',
      'string.empty': 'INVOICE_ADDRESS_TYPE_REQUIRED',
      'any.required': 'INVOICE_ADDRESS_TYPE_REQUIRED'
    })
})
