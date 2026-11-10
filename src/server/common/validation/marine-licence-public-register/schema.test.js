import { marineLicencePublicRegisterSchema } from '#src/server/common/validation/marine-licence-public-register/schema.js'

describe('#marineLicencePublicRegisterSchema', () => {
  test('should validate when no information is withheld', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'no'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when information is withheld with details', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'yes',
      reason: 'Some details'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({})
    expect(error.message).toBe('PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED')
  })

  test('should fail on invalid withholdConsent value', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'invalid'
    })
    expect(error.message).toBe('PUBLIC_REGISTER_WITHHOLD_CONSENT_REQUIRED')
  })

  test('should fail when withholding but details are empty', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'yes',
      reason: ''
    })
    expect(error.message).toBe('PUBLIC_REGISTER_REASON_REQUIRED')
  })

  test('should fail when details exceed 1000 characters', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'yes',
      reason: 'x'.repeat(1001)
    })
    expect(error.message).toBe('PUBLIC_REGISTER_REASON_MAX_LENGTH')
  })

  test.each([
    ['1,000 emoji', '👍🏽'.repeat(1000)],
    ['999 characters with CRLF line breaks', 'a\r\n'.repeat(499) + 'a'],
    ['1,000 characters with trailing whitespace', 'a'.repeat(1000) + '  \r\n']
  ])('should validate a reason of %s', (_description, reason) => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'yes',
      reason
    })
    expect(error).toBeUndefined()
  })

  test('should fail when the reason is stored in more than 10,000 code units', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'yes',
      reason: ('a' + '\u0301'.repeat(20)).repeat(500)
    })
    expect(error.message).toBe('PUBLIC_REGISTER_REASON_MAX_LENGTH')
  })
})
