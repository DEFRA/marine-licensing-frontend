import { invoiceContactDetailsSchema } from '#src/server/common/validation/invoicing/invoice-contact-details/schema.js'

describe('#invoiceContactDetailsSchema', () => {
  const validContactDetails = {
    fullName: 'Jane Smith',
    organisationName: 'Example Organisation',
    phoneNumber: '0191 376 2791',
    emailAddress: 'jane.smith@example.com'
  }

  test('should validate complete contact details', () => {
    const { error } = invoiceContactDetailsSchema.validate(validContactDetails)
    expect(error).toBeUndefined()
  })

  test('should fail when full name is missing', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      fullName: ''
    })
    expect(error.message).toBe('INVOICING_CONTACT_FULL_NAME_REQUIRED')
  })

  test('should fail when full name is too long', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      fullName: 'a'.repeat(101)
    })
    expect(error.message).toBe('INVOICING_CONTACT_FULL_NAME_MAX_LENGTH')
  })

  test('should fail when organisation name is missing', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      organisationName: ''
    })
    expect(error.message).toBe('INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED')
  })

  test('should fail when organisation name is missing', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      organisationName: 'a'.repeat(101)
    })
    expect(error.message).toBe('INVOICING_CONTACT_ORGANISATION_NAME_MAX_LENGTH')
  })

  test('should fail when phone number is missing', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      phoneNumber: ''
    })
    expect(error.message).toBe('INVOICING_CONTACT_PHONE_NUMBER_REQUIRED')
  })

  test('should fail when phone number is invalid', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      phoneNumber: 'test'
    })
    expect(error.message).toBe('INVOICING_CONTACT_PHONE_NUMBER_INVALID')
  })

  test('should fail when email address is missing', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      emailAddress: ''
    })
    expect(error.message).toBe('INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED')
  })

  test('should fail when email address is too long', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      emailAddress: 'a'.repeat(265)
    })
    expect(error.message).toBe('INVOICING_CONTACT_EMAIL_ADDRESS_MAX_LENGTH')
  })

  test('should fail when email address is invalid', () => {
    const { error } = invoiceContactDetailsSchema.validate({
      ...validContactDetails,
      emailAddress: 'invalidEmail'
    })
    expect(error.message).toBe('INVOICING_CONTACT_EMAIL_ADDRESS_INVALID')
  })

  test('should fail on empty payload', () => {
    const { error } = invoiceContactDetailsSchema.validate(
      {},
      { abortEarly: false }
    )
    const messages = error.details.map((detail) => detail.message)
    expect(messages).toContain('INVOICING_CONTACT_FULL_NAME_REQUIRED')
    expect(messages).toContain('INVOICING_CONTACT_ORGANISATION_NAME_REQUIRED')
    expect(messages).toContain('INVOICING_CONTACT_PHONE_NUMBER_REQUIRED')
    expect(messages).toContain('INVOICING_CONTACT_EMAIL_ADDRESS_REQUIRED')
  })

  test('should trim whitespace from all fields', () => {
    const { error, value } = invoiceContactDetailsSchema.validate({
      fullName: '  Jane Smith  ',
      organisationName: '  Example Organisation  ',
      phoneNumber: '  0191 376 2791  ',
      emailAddress: '  jane.smith@example.com  '
    })
    expect(error).toBeUndefined()
    expect(value).toEqual(validContactDetails)
  })
})
