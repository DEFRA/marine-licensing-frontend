import { ukInvoiceAddressSchema } from '#src/server/common/validation/invoicing/uk-invoice-address/schema.js'

describe('#ukInvoiceAddressSchema', () => {
  const validAddress = {
    addressLine1: '123 Example Street',
    addressLine2: 'Flat 2',
    addressTown: 'Exampletown',
    addressCounty: 'Exampleshire',
    addressPostcode: 'AA1 1AA'
  }

  test('should validate a complete address', () => {
    const { error } = ukInvoiceAddressSchema.validate(validAddress)
    expect(error).toBeUndefined()
  })

  test('should validate when optional fields are empty', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      addressLine1: '123 Example Street',
      addressLine2: '',
      addressTown: 'Exampletown',
      addressCounty: '',
      addressPostcode: 'AA1 1AA'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when optional fields are omitted', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      addressLine1: '123 Example Street',
      addressTown: 'Exampletown',
      addressPostcode: 'AA1 1AA'
    })
    expect(error).toBeUndefined()
  })

  test('should fail when addressLine1 is missing', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressLine1: ''
    })
    expect(error.message).toBe('ADDRESS_LINE_1_REQUIRED')
  })

  test('should fail when addressTown is missing', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressTown: ''
    })
    expect(error.message).toBe('ADDRESS_TOWN_REQUIRED')
  })

  test('should fail when addressPostcode is missing', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressPostcode: ''
    })
    expect(error.message).toBe('ADDRESS_POSTCODE_REQUIRED')
  })

  test('should fail on empty payload', () => {
    const { error } = ukInvoiceAddressSchema.validate({}, { abortEarly: false })
    const messages = error.details.map((detail) => detail.message)
    expect(messages).toContain('ADDRESS_LINE_1_REQUIRED')
    expect(messages).toContain('ADDRESS_TOWN_REQUIRED')
    expect(messages).toContain('ADDRESS_POSTCODE_REQUIRED')
  })

  test('should trim whitespace from values', () => {
    const { error, value } = ukInvoiceAddressSchema.validate({
      addressLine1: '  123 Example Street  ',
      addressLine2: '  Flat 2  ',
      addressTown: '  Exampletown  ',
      addressCounty: '  Exampleshire  ',
      addressPostcode: '  AA1 1AA  '
    })
    expect(error).toBeUndefined()
    expect(value).toEqual(validAddress)
  })
})
