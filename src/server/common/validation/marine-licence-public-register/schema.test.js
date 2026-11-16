import { marineLicencePublicRegisterSchema } from '#src/server/common/validation/marine-licence-public-register/schema.js'

describe('#marineLicencePublicRegisterSchema', () => {
  test('should validate when no information is withheld', () => {
    const { error } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'no'
    })
    expect(error).toBeUndefined()
  })

  test.each(['nationalSecurity', 'commercialConfidentiality'])(
    'should validate when information is withheld for %s',
    (withholdReason) => {
      const { error } = marineLicencePublicRegisterSchema.validate({
        withholdConsent: 'yes',
        withholdReason
      })
      expect(error).toBeUndefined()
    }
  )

  test('should strip a withhold reason when no information is withheld', () => {
    const { error, value } = marineLicencePublicRegisterSchema.validate({
      withholdConsent: 'no',
      withholdReason: 'nationalSecurity'
    })
    expect(error).toBeUndefined()
    expect(value).toEqual({ withholdConsent: 'no' })
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

  test.each([
    { name: 'missing', withholdReason: undefined },
    { name: 'empty', withholdReason: '' },
    { name: 'not a known reason', withholdReason: 'other' }
  ])(
    'should fail when withholding and the reason is $name',
    ({ withholdReason }) => {
      const { error } = marineLicencePublicRegisterSchema.validate({
        withholdConsent: 'yes',
        withholdReason
      })
      expect(error.message).toBe('PUBLIC_REGISTER_WITHHOLD_REASON_REQUIRED')
    }
  )
})
