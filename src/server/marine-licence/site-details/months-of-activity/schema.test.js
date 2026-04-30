import { monthsOfActivitySchema } from '#src/server/marine-licence/site-details/months-of-activity/schema.js'

describe('#monthsOfActivitySchema', () => {
  test('should validate when months is no', () => {
    const { error } = monthsOfActivitySchema.validate({ months: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when months is yes with details', () => {
    const { error } = monthsOfActivitySchema.validate({
      months: 'yes',
      details: 'January to March only'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = monthsOfActivitySchema.validate({})
    expect(error.message).toBe('MONTHS_OF_ACTIVITY_REQUIRED')
  })

  test('should fail on invalid months value', () => {
    const { error } = monthsOfActivitySchema.validate({
      months: 'invalid'
    })
    expect(error.message).toBe('MONTHS_OF_ACTIVITY_REQUIRED')
  })

  test('should fail when months is yes but details is empty', () => {
    const { error } = monthsOfActivitySchema.validate({
      months: 'yes',
      details: ''
    })
    expect(error.message).toBe('MONTHS_OF_ACTIVITY_DETAILS_REQUIRED')
  })

  test('should fail when details exceeds 1000 characters', () => {
    const { error } = monthsOfActivitySchema.validate({
      months: 'yes',
      details: 'x'.repeat(1001)
    })
    expect(error.message).toBe('MONTHS_OF_ACTIVITY_DETAILS_MAX_LENGTH')
  })
})
