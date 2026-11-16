import { marineLicencePublicRegisterCommercialConfidentialitySchema } from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/schema.js'
import { marineLicencePublicRegisterCommercialConfidentialityErrorMessages } from '#src/server/common/validation/marine-licence-public-register-commercial-confidentiality/constants.js'

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

  test.each([
    { name: '1000 characters', reason: 'a'.repeat(1000) },
    {
      name: '1000 characters with line breaks',
      reason: `${'a'.repeat(498)}\r\n${'a'.repeat(500)}\r\n`
    },
    { name: '1000 multi-code-unit characters', reason: '👍🏽'.repeat(1000) }
  ])('should pass with $name', ({ reason }) => {
    expect(schema.validate({ reason }).error).toBeUndefined()
  })

  test('should fail with 1001 characters', () => {
    const { error } = schema.validate({ reason: 'a'.repeat(1001) })
    expect(error.message).toBe(
      'PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH'
    )
  })

  test('has the error messages from the design', () => {
    expect(
      marineLicencePublicRegisterCommercialConfidentialityErrorMessages
    ).toEqual({
      PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_REQUIRED:
        'Enter details of what you want withheld',
      PUBLIC_REGISTER_COMMERCIAL_CONFIDENTIALITY_REASON_MAX_LENGTH:
        'Details of what you want withheld must be 1000 characters or fewer'
    })
  })
})
