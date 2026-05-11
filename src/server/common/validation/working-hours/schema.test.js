import { workingHoursSchema } from '#src/server/common/validation/working-hours/schema.js'
import { WORKING_HOURS_MAX_LENGTH } from '#src/server/common/validation/working-hours/constants.js'

describe('#workingHoursSchema', () => {
  test('passes with valid input', () => {
    const { error } = workingHoursSchema.validate({
      workingHours: 'Monday to Friday, 9am to 5pm'
    })

    expect(error).toBeUndefined()
  })

  test('fails with empty string', () => {
    const { error } = workingHoursSchema.validate({
      workingHours: ''
    })

    expect(error.message).toBe('WORKING_HOURS_REQUIRED')
  })

  test('fails when field is missing', () => {
    const { error } = workingHoursSchema.validate({})

    expect(error.message).toBe('WORKING_HOURS_REQUIRED')
  })

  test('fails when input exceeds max length', () => {
    const { error } = workingHoursSchema.validate({
      workingHours: 'a'.repeat(WORKING_HOURS_MAX_LENGTH + 1)
    })

    expect(error.message).toBe('WORKING_HOURS_MAX_LENGTH')
  })

  test('passes when input is exactly max length', () => {
    const { error } = workingHoursSchema.validate({
      workingHours: 'a'.repeat(WORKING_HOURS_MAX_LENGTH)
    })

    expect(error).toBeUndefined()
  })
})
