import { invoiceAddressPostcodeSearchSchema } from '#src/server/common/validation/invoicing/invoice-address-postcode-search/schema.js'

describe('#invoiceAddressPostcodeSearchSchema', () => {
  test('should validate a postcode with an optional property name or number', () => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({
      postcode: 'NE4 7AR',
      propertyNameOrNumber: 'Tyneside House'
    })
    expect(error).toBeUndefined()
  })

  test.each([
    ['empty', ''],
    ['omitted', undefined]
  ])('should validate when propertyNameOrNumber is %s', (_name, value) => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({
      postcode: 'NE4 7AR',
      ...(value === undefined ? {} : { propertyNameOrNumber: value })
    })
    expect(error).toBeUndefined()
  })

  test.each(['NE4 7AR', 'ne4 7ar', 'NE47AR', 'AA1 1AA', 'SW1A 1AA'])(
    'should pass when postcode "%s" is valid',
    (postcode) => {
      const { error } = invoiceAddressPostcodeSearchSchema.validate({
        postcode
      })
      expect(error).toBeUndefined()
    }
  )

  test('should fail when postcode is empty', () => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({
      postcode: ''
    })
    expect(error.message).toBe('POSTCODE_REQUIRED')
  })

  test('should fail when postcode is missing', () => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({})
    expect(error.message).toBe('POSTCODE_REQUIRED')
  })

  test.each(['not a postcode', '12345', 'NE4', 'BF1 1AA'])(
    'should fail when postcode "%s" is invalid',
    (postcode) => {
      const { error } = invoiceAddressPostcodeSearchSchema.validate({
        postcode
      })
      expect(error.message).toBe('POSTCODE_INVALID')
    }
  )

  test('should pass when propertyNameOrNumber is 50 characters', () => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({
      postcode: 'NE4 7AR',
      propertyNameOrNumber: 'a'.repeat(50)
    })
    expect(error).toBeUndefined()
  })

  test('should fail when propertyNameOrNumber is longer than 50 characters', () => {
    const { error } = invoiceAddressPostcodeSearchSchema.validate({
      postcode: 'NE4 7AR',
      propertyNameOrNumber: 'a'.repeat(51)
    })
    expect(error.message).toBe('PROPERTY_NAME_OR_NUMBER_MAX_LENGTH')
  })
})
