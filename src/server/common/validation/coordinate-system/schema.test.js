import { coordinateSystemSchema } from '#src/server/common/validation/coordinate-system/schema.js'

describe('#coordinateSystemSchema', () => {
  test('should validate valid wgs84 option', () => {
    const { error } = coordinateSystemSchema.validate({
      coordinateSystem: 'wgs84'
    })

    expect(error).toBeUndefined()
  })

  test('should validate valid osgb36 option', () => {
    const { error } = coordinateSystemSchema.validate({
      coordinateSystem: 'osgb36'
    })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = coordinateSystemSchema.validate({})

    expect(error.message).toBe('COORDINATE_SYSTEM_REQUIRED')
  })

  test('should fail on invalid value', () => {
    const { error } = coordinateSystemSchema.validate({
      coordinateSystem: 'invalid'
    })

    expect(error.message).toBe('COORDINATE_SYSTEM_REQUIRED')
  })
})
