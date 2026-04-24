import { selectActivitySchema } from '#src/server/marine-licence/site-details/select-activity/schema.js'

describe('#selectActivitySchema', () => {
  test('should validate when a single activity is selected', () => {
    const { error } = selectActivitySchema.validate({ activities: 'CON1' })
    expect(error).toBeUndefined()
  })

  test('should validate when multiple activities are selected', () => {
    const { error } = selectActivitySchema.validate({
      activities: ['CON1', 'CON2']
    })
    expect(error).toBeUndefined()
  })

  test('should validate when other is selected with a other', () => {
    const { error } = selectActivitySchema.validate({
      activities: 'other',
      otherActivity: 'Some other'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when other is selected alongside other activities with a other', () => {
    const { error } = selectActivitySchema.validate({
      activities: ['CON1', 'other'],
      otherActivity: 'Some other'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = selectActivitySchema.validate({})
    expect(error.message).toBe('ACTIVITIES_REQUIRED')
  })

  test('should fail when other is selected but other is empty', () => {
    const { error } = selectActivitySchema.validate({
      activities: 'other',
      otherActivity: ''
    })
    expect(error.message).toBe('ACTIVITIES_OTHER_REASON_REQUIRED')
  })

  test('should fail when other is selected but other is missing', () => {
    const { error } = selectActivitySchema.validate({ activities: 'other' })
    expect(error.message).toBe('ACTIVITIES_OTHER_REASON_REQUIRED')
  })

  test('should fail when other is in array but other is missing', () => {
    const { error } = selectActivitySchema.validate({
      activities: ['CON1', 'other']
    })
    expect(error.message).toBe('ACTIVITIES_OTHER_REASON_REQUIRED')
  })

  test('should fail when other exceeds 1000 characters', () => {
    const { error } = selectActivitySchema.validate({
      activities: 'other',
      otherActivity: 'x'.repeat(1001)
    })
    expect(error.message).toBe('ACTIVITIES_OTHER_REASON_MAX_LENGTH')
  })
})
