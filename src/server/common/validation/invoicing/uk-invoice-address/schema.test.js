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

  test('should fail when town is missing', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressTown: ''
    })
    expect(error.message).toBe('ADDRESS_TOWN_REQUIRED')
  })

  test('should fail when postcode is missing', () => {
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

  test('should fail when addressLine1 exceeds 100 characters', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressLine1: 'a'.repeat(101)
    })
    expect(error.message).toBe('ADDRESS_LINE_1_MAX_LENGTH')
  })

  test('should fail when addressLine2 exceeds 100 characters', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressLine2: 'a'.repeat(101)
    })
    expect(error.message).toBe('ADDRESS_LINE_2_MAX_LENGTH')
  })

  test('should fail when addressTown exceeds 30 characters', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressTown: 'a'.repeat(31)
    })
    expect(error.message).toBe('ADDRESS_TOWN_MAX_LENGTH')
  })

  test('should fail when addressCounty exceeds 50 characters', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressCounty: 'a'.repeat(51)
    })
    expect(error.message).toBe('ADDRESS_COUNTY_MAX_LENGTH')
  })

  test.each([
    'AA1 1AA',
    'AA11AA',
    'aa1 1aa',
    'M1 1AE',
    'M60 1NW',
    'CR2 6XH',
    'DN55 1PT',
    'W1A 1HQ',
    'EC1A 1BB'
  ])('should validate postcode format %s', (addressPostcode) => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressPostcode
    })
    expect(error).toBeUndefined()
  })

  test.each(['NOT A POSTCODE', 'A1', '12345', 'AA1 1A'])(
    'should fail when postcode is invalid: %s',
    (addressPostcode) => {
      const { error } = ukInvoiceAddressSchema.validate({
        ...validAddress,
        addressPostcode
      })
      expect(error.message).toBe('ADDRESS_POSTCODE_INVALID')
    }
  )
  test.each([
    'NOT A POSTCODE',
    'A1',
    '12345',
    'AA1 1A',
    'BF1 1AA',
    'BF18 1AA',
    'bf1 1aa'
  ])('should fail when postcode is invalid: %s', (addressPostcode) => {
    const { error } = ukInvoiceAddressSchema.validate({
      ...validAddress,
      addressPostcode
    })
    expect(error.message).toBe('ADDRESS_POSTCODE_INVALID')
  })

  test('should validate at exact max lengths', () => {
    const { error } = ukInvoiceAddressSchema.validate({
      addressLine1: 'a'.repeat(100),
      addressLine2: 'a'.repeat(100),
      addressTown: 'a'.repeat(30),
      addressCounty: 'a'.repeat(50),
      addressPostcode: 'AA1 1AA'
    })
    expect(error).toBeUndefined()
  })
})
