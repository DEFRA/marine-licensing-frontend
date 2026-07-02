import { harbourAuthoritySchema } from '#src/server/common/validation/harbour-authority/schema.js'

describe('#harbourAuthoritySchema', () => {
  test('should validate when area is no', () => {
    const { error } = harbourAuthoritySchema.validate({ area: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when area is yes with details', () => {
    const { error } = harbourAuthoritySchema.validate({
      area: 'yes',
      details: 'The Port of Tyne harbour authority area.'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = harbourAuthoritySchema.validate({})
    expect(error.message).toBe('HARBOUR_AUTHORITY_REQUIRED')
  })

  test('should fail on invalid area value', () => {
    const { error } = harbourAuthoritySchema.validate({
      area: 'maybe'
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_REQUIRED')
  })

  test('should fail when area is yes but details is empty', () => {
    const { error } = harbourAuthoritySchema.validate({
      area: 'yes',
      details: ''
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_AREA_REQUIRED')
  })

  test('should fail when details exceeds 1000 characters', () => {
    const { error } = harbourAuthoritySchema.validate({
      area: 'yes',
      details: 'a'.repeat(1001)
    })
    expect(error.message).toBe('HARBOUR_AUTHORITY_AREA_MAX_LENGTH')
  })
})
