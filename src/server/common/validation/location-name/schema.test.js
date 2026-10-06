import { locationNameSchema } from '#src/server/common/validation/location-name/schema.js'
import { LOCATION_NAME_MAX_LENGTH } from '#src/server/common/validation/location-name/constants.js'

describe('locationNameSchema', () => {
  test('passes with a valid location name', () => {
    const { error } = locationNameSchema.validate({
      locationName: 'Tynemouth harbour, noticeboard by north pier'
    })

    expect(error).toBeUndefined()
  })

  test('passes when the location name is exactly the max length', () => {
    const { error } = locationNameSchema.validate({
      locationName: 'A'.repeat(LOCATION_NAME_MAX_LENGTH)
    })

    expect(error).toBeUndefined()
  })

  test('fails when the location name is missing', () => {
    const { error } = locationNameSchema.validate({})

    expect(error.message).toBe('LOCATION_NAME_REQUIRED')
  })

  test('fails when the location name is empty', () => {
    const { error } = locationNameSchema.validate({ locationName: '' })

    expect(error.message).toBe('LOCATION_NAME_REQUIRED')
  })

  test('fails when the location name is too long', () => {
    const { error } = locationNameSchema.validate({
      locationName: 'A'.repeat(LOCATION_NAME_MAX_LENGTH + 1)
    })

    expect(error.message).toBe('LOCATION_NAME_MAX_LENGTH')
  })
})
