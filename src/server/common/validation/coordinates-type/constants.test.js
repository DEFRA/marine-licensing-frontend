import { coordinatesTypeSchema } from '#src/server/common/validation/coordinates-type/constants.js'

describe('#coordinatesTypeSchema', () => {
  test('should validate valid file option', () => {
    const { error } = coordinatesTypeSchema.validate({
      coordinatesType: 'file'
    })

    expect(error).toBeUndefined()
  })

  test('should validate valid coordinates option', () => {
    const { error } = coordinatesTypeSchema.validate({
      coordinatesType: 'coordinates'
    })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = coordinatesTypeSchema.validate({})

    expect(error.message).toBe('PROVIDE_COORDINATES_CHOICE_REQUIRED')
  })

  test('should fail on invalid value', () => {
    const { error } = coordinatesTypeSchema.validate({
      coordinatesType: 'invalid'
    })

    expect(error.message).toBe('PROVIDE_COORDINATES_CHOICE_REQUIRED')
  })
})
