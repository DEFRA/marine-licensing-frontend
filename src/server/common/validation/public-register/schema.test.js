import { publicRegisterSchema } from '#src/server/common/validation/public-register/schema.js'

describe('#publicRegisterSchema', () => {
  test('should validate when consent is yes', () => {
    const { error } = publicRegisterSchema.validate({ consent: 'yes' })
    expect(error).toBeUndefined()
  })

  test('should validate when consent is no with a reason', () => {
    const { error } = publicRegisterSchema.validate({
      consent: 'no',
      reason: 'Some reason'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = publicRegisterSchema.validate({})
    expect(error.message).toBe('PUBLIC_REGISTER_CONSENT_REQUIRED')
  })

  test('should fail on invalid consent value', () => {
    const { error } = publicRegisterSchema.validate({ consent: 'invalid' })
    expect(error.message).toBe('PUBLIC_REGISTER_CONSENT_REQUIRED')
  })

  test('should fail when consent is no but reason is empty', () => {
    const { error } = publicRegisterSchema.validate({
      consent: 'no',
      reason: ''
    })
    expect(error.message).toBe('PUBLIC_REGISTER_REASON_REQUIRED')
  })

  test('should fail when reason exceeds 1000 characters', () => {
    const { error } = publicRegisterSchema.validate({
      consent: 'no',
      reason: 'x'.repeat(1001)
    })
    expect(error.message).toBe('PUBLIC_REGISTER_REASON_MAX_LENGTH')
  })
})
