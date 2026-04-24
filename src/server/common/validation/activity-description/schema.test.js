import { activityDescriptionSchema } from '#src/server/common/validation/activity-description/schema.js'
import { ACTIVITY_DESCRIPTION_MAX_LENGTH } from '#src/server/common/validation/activity-description/constants.js'

describe('#activityDescriptionSchema', () => {
  test('passes with valid input', () => {
    const { error } = activityDescriptionSchema.validate({
      activityDescription: 'A valid activity description'
    })

    expect(error).toBeUndefined()
  })

  test('fails with empty string', () => {
    const { error } = activityDescriptionSchema.validate({
      activityDescription: ''
    })

    expect(error.message).toBe('ACTIVITY_DESCRIPTION_REQUIRED')
  })

  test('fails when field is missing', () => {
    const { error } = activityDescriptionSchema.validate({})

    expect(error.message).toBe('ACTIVITY_DESCRIPTION_REQUIRED')
  })

  test('fails when input exceeds max length', () => {
    const { error } = activityDescriptionSchema.validate({
      activityDescription: 'a'.repeat(ACTIVITY_DESCRIPTION_MAX_LENGTH + 1)
    })

    expect(error.message).toBe('ACTIVITY_DESCRIPTION_MAX_LENGTH')
  })

  test('passes when input is exactly max length', () => {
    const { error } = activityDescriptionSchema.validate({
      activityDescription: 'a'.repeat(ACTIVITY_DESCRIPTION_MAX_LENGTH)
    })

    expect(error).toBeUndefined()
  })
})
