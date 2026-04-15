import { coordinatesEntrySchema } from '#src/server/common/validation/coordinates-entry/schema.js'

describe('#coordinatesEntrySchema', () => {
  test('should validate valid single option', () => {
    const { error } = coordinatesEntrySchema.validate({
      coordinatesEntry: 'single'
    })

    expect(error).toBeUndefined()
  })

  test('should validate valid multiple option', () => {
    const { error } = coordinatesEntrySchema.validate({
      coordinatesEntry: 'multiple'
    })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = coordinatesEntrySchema.validate({})

    expect(error.message).toBe('COORDINATES_ENTRY_REQUIRED')
  })

  test('should fail on invalid value', () => {
    const { error } = coordinatesEntrySchema.validate({
      coordinatesEntry: 'invalid'
    })

    expect(error.message).toBe('COORDINATES_ENTRY_REQUIRED')
  })
})
