import { chooseFileTypeSchema } from '#src/server/common/validation/choose-file-type/schema.js'

describe('#chooseFileTypeSchema', () => {
  test('should validate valid shapefile option', () => {
    const { error } = chooseFileTypeSchema.validate({
      fileUploadType: 'shapefile'
    })

    expect(error).toBeUndefined()
  })

  test('should validate valid kml option', () => {
    const { error } = chooseFileTypeSchema.validate({ fileUploadType: 'kml' })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = chooseFileTypeSchema.validate({})

    expect(error.message).toBe('FILE_TYPE_ENTRY_REQUIRED')
  })

  test('should fail on invalid value', () => {
    const { error } = chooseFileTypeSchema.validate({ fileUploadType: 'csv' })

    expect(error.message).toBe('FILE_TYPE_ENTRY_REQUIRED')
  })
})
