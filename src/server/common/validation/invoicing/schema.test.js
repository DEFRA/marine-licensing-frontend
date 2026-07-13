import { isInvoiceAddressUkOrInternationalSchema } from '#src/server/common/validation/invoicing/schema.js'

describe('#isInvoiceAddressUkOrInternationalSchema', () => {
  test('should validate when invoiceAddressType is uk', () => {
    const { error } = isInvoiceAddressUkOrInternationalSchema.validate({
      invoiceAddressType: 'uk'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when invoiceAddressType is international', () => {
    const { error } = isInvoiceAddressUkOrInternationalSchema.validate({
      invoiceAddressType: 'international'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = isInvoiceAddressUkOrInternationalSchema.validate({})
    expect(error.message).toBe('INVOICE_ADDRESS_TYPE_REQUIRED')
  })

  test('should fail on invalid invoiceAddressType value', () => {
    const { error } = isInvoiceAddressUkOrInternationalSchema.validate({
      invoiceAddressType: 'europe'
    })
    expect(error.message).toBe('INVOICE_ADDRESS_TYPE_REQUIRED')
  })

  test('should fail on empty invoiceAddressType', () => {
    const { error } = isInvoiceAddressUkOrInternationalSchema.validate({
      invoiceAddressType: ''
    })
    expect(error.message).toBe('INVOICE_ADDRESS_TYPE_REQUIRED')
  })
})
