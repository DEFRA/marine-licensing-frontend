import { marineLicencePublicRegisterNationalSecuritySchema } from '#src/server/common/validation/marine-licence-public-register-national-security/schema.js'

const schema = marineLicencePublicRegisterNationalSecuritySchema

describe('#marineLicencePublicRegisterNationalSecuritySchema', () => {
  test('should strip the reason when there is no approval', () => {
    const { error, value } = schema.validate({
      nationalSecurityApproval: 'no',
      reason: 'Details'
    })
    expect(error).toBeUndefined()
    expect(value).toEqual({ nationalSecurityApproval: 'no' })
  })

  test('should validate and trim the reason when there is approval', () => {
    const { error, value } = schema.validate({
      nationalSecurityApproval: 'yes',
      reason: '  Details of the berth  '
    })
    expect(error).toBeUndefined()
    expect(value.reason).toBe('Details of the berth')
  })

  test.each([
    { name: 'missing', payload: {} },
    { name: 'empty', payload: { nationalSecurityApproval: '' } },
    { name: 'not yes or no', payload: { nationalSecurityApproval: 'maybe' } }
  ])('should fail when the answer is $name', ({ payload }) => {
    const { error } = schema.validate(payload)
    expect(error.message).toBe(
      'PUBLIC_REGISTER_NATIONAL_SECURITY_APPROVAL_REQUIRED'
    )
  })

  test.each([
    { name: 'missing', reason: undefined },
    { name: 'empty', reason: '' },
    { name: 'only whitespace', reason: '  \n  ' }
  ])('should fail when approved and the reason is $name', ({ reason }) => {
    const { error } = schema.validate({
      nationalSecurityApproval: 'yes',
      reason
    })
    expect(error.message).toBe(
      'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_REQUIRED'
    )
  })

  test('should pass with exactly 1000 characters', () => {
    const { error } = schema.validate({
      nationalSecurityApproval: 'yes',
      reason: 'a'.repeat(1000)
    })
    expect(error).toBeUndefined()
  })

  test('should count user-perceived characters towards the limit', () => {
    const { error } = schema.validate({
      nationalSecurityApproval: 'yes',
      reason: '👍🏽'.repeat(1000)
    })
    expect(error).toBeUndefined()
  })

  test('should fail with 1001 characters', () => {
    const { error } = schema.validate({
      nationalSecurityApproval: 'yes',
      reason: 'a'.repeat(1001)
    })
    expect(error.message).toBe(
      'PUBLIC_REGISTER_NATIONAL_SECURITY_REASON_MAX_LENGTH'
    )
  })
})
