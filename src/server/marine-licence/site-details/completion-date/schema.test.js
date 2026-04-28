import { completionDateSchema } from '#src/server/marine-licence/site-details/completion-date/schema.js'

describe('#completionDateSchema', () => {
  test('should validate when completionDate is no', () => {
    const { error } = completionDateSchema.validate({ completionDate: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when completionDate is yes with a reason', () => {
    const { error } = completionDateSchema.validate({
      completionDate: 'yes',
      reason: 'Some reason'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = completionDateSchema.validate({})
    expect(error.message).toBe('COMPLETION_DATE_REQUIRED')
  })

  test('should fail on invalid completionDate value', () => {
    const { error } = completionDateSchema.validate({
      completionDate: 'invalid'
    })
    expect(error.message).toBe('COMPLETION_DATE_REQUIRED')
  })

  test('should fail when completionDate is yes but reason is empty', () => {
    const { error } = completionDateSchema.validate({
      completionDate: 'yes',
      reason: ''
    })
    expect(error.message).toBe('COMPLETION_DATE_REASON_REQUIRED')
  })

  test('should fail when reason exceeds 1000 characters', () => {
    const { error } = completionDateSchema.validate({
      completionDate: 'yes',
      reason: 'x'.repeat(1001)
    })
    expect(error.message).toBe('COMPLETION_DATE_REASON_MAX_LENGTH')
  })
})
