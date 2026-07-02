import { harbourAuthoritySchema } from '#src/server/common/validation/harbour-authority/schema.js'

describe('#harbourAuthoritySchema', () => {
  test('should validate when harbourArea is no', () => {
    const { error } = harbourAuthoritySchema.validate({ harbourArea: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when harbourArea is yes with details', () => {
    const { error } = harbourAuthoritySchema.validate({
      harbourArea: 'yes',
      details: 'The Port of Tyne harbour authority area.'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = harbourAuthoritySchema.validate({})
    expect(error.message).toBe('HARBOUR_AUTHORITY_REQUIRED')
  })

  test('should fail on invalid harbourArea value', () => {
    const { error } = harbourAuthoritySchema.validate({
      harbourArea: 'maybe'
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_REQUIRED')
  })

  test('should fail when harbourArea is yes but details is empty', () => {
    const { error } = harbourAuthoritySchema.validate({
      harbourArea: 'yes',
      details: ''
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_AREA_REQUIRED')
  })

  test('should fail when details exceeds 1000 characters', () => {
    const { error } = harbourAuthoritySchema.validate({
      harbourArea: 'yes',
      details: 'a'.repeat(1001)
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_AREA_MAX_LENGTH')
  })
})
