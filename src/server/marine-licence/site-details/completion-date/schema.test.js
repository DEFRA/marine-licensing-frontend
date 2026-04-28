import { completionDateSchema } from '#src/server/marine-licence/site-details/completion-date/schema.js'

describe('#completionDateSchema', () => {
  test('should validate when date is no', () => {
    const { error } = completionDateSchema.validate({ date: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when date is yes with a reason', () => {
    const { error } = completionDateSchema.validate({
      date: 'yes',
      reason: 'Some reason'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = completionDateSchema.validate({})
    expect(error.message).toBe('COMPLETION_DATE_REQUIRED')
  })

  test('should fail on invalid date value', () => {
    const { error } = completionDateSchema.validate({
      date: 'invalid'
    })
    expect(error.message).toBe('COMPLETION_DATE_REQUIRED')
  })

  test('should fail when date is yes but reason is empty', () => {
    const { error } = completionDateSchema.validate({
      date: 'yes',
      reason: ''
    })
    expect(error.message).toBe('COMPLETION_DATE_REASON_REQUIRED')
  })

  test('should fail when reason exceeds 1000 characters', () => {
    const { error } = completionDateSchema.validate({
      date: 'yes',
      reason: 'x'.repeat(1001)
    })
    expect(error.message).toBe('COMPLETION_DATE_REASON_MAX_LENGTH')
  })
})
