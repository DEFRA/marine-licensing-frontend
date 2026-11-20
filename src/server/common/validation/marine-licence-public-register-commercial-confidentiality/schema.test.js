import { marineLicencePublicRegisterCommercialConfidentialitySchema } from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/schema.js'

const schema = marineLicencePublicRegisterCommercialConfidentialitySchema

describe('#marineLicencePublicRegisterCommercialConfidentialitySchema', () => {
  test('should validate and trim the reason', () => {
    const { error, value } = schema.validate({ reason: '  Pricing details  ' })
    expect(error).toBeUndefined()
    expect(value.reason).toBe('Pricing details')
  })

  test.each([
    { name: 'missing', reason: undefined },
    { name: 'empty', reason: '' },
    { name: 'only whitespace', reason: '  \r\n  ' }
  ])('should fail when the reason is $name', ({ reason }) => {
    const { error } = schema.validate({ reason })
    expect(error.message).toBe(
      'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_REQUIRED'
    )
  })

  test('should pass with 1000 characters', () => {
    expect(schema.validate({ reason: 'a'.repeat(1000) }).error).toBeUndefined()
  })

  test('should fail with 1001 characters', () => {
    const { error } = schema.validate({ reason: 'a'.repeat(1001) })
    expect(error.message).toBe(
      'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH'
    )
  })
})
