import { internationalInvoiceAddressSchema } from '#src/server/common/validation/invoicing/international-invoice-address/schema.js'

describe('#internationalInvoiceAddressSchema', () => {
  const validAddress = {
    country: 'United Kingdom',
    address: '123 Example Street\nExampletown\nExampleshire\nAA1 1AA'
  }

  test('should validate a complete address', () => {
    const { error } = internationalInvoiceAddressSchema.validate(validAddress)
    expect(error).toBeUndefined()
  })

  test('should fail when country is missing', () => {
    const { error } = internationalInvoiceAddressSchema.validate({
      ...validAddress,
      country: ''
    })
    expect(error.message).toBe('INVOICING_COUNTRY_REQUIRED')
  })

  test('should fail when country is not in the list of countries', () => {
    const { error } = internationalInvoiceAddressSchema.validate({
      ...validAddress,
      country: 'Nonsenseland'
    })
    expect(error.message).toBe('INVOICING_COUNTRY_REQUIRED')
  })

  test('should fail when address is missing', () => {
    const { error } = internationalInvoiceAddressSchema.validate({
      ...validAddress,
      address: ''
    })
    expect(error.message).toBe('INVOICING_ADDRESS_REQUIRED')
  })

  test('should fail on empty payload', () => {
    const { error } = internationalInvoiceAddressSchema.validate(
      {},
      { abortEarly: false }
    )
    const messages = error.details.map((detail) => detail.message)
    expect(messages).toContain('INVOICING_COUNTRY_REQUIRED')
    expect(messages).toContain('INVOICING_ADDRESS_REQUIRED')
  })

  test('should trim whitespace from address', () => {
    const { error, value } = internationalInvoiceAddressSchema.validate({
      country: 'United Kingdom',
      address: '  123 Example Street  '
    })
    expect(error).toBeUndefined()
    expect(value).toEqual({
      country: 'United Kingdom',
      address: '123 Example Street'
    })
  })

  test('should fail when address exceeds 300 characters', () => {
    const { error } = internationalInvoiceAddressSchema.validate({
      ...validAddress,
      address: 'a'.repeat(301)
    })
    expect(error.message).toBe('INVOICING_ADDRESS_MAX_LENGTH')
  })

  test('should validate at exact max length', () => {
    const { error } = internationalInvoiceAddressSchema.validate({
      country: 'United Kingdom',
      address: 'a'.repeat(300)
    })
    expect(error).toBeUndefined()
  })
})
