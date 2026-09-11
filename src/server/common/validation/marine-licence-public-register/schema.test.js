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
    expect(error.message).toBe('PUBLIC_REGISTER_CONSENT_REQUIRED')
  })

  test('should fail on invalid withholdConsent value', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'invalid'
    })
    expect(error.message).toBe('PUBLIC_REGISTER_CONSENT_REQUIRED')
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
})
