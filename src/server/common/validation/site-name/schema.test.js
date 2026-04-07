import { siteNameSchema } from '#src/server/common/validation/site-name/schema.js'

describe('#siteNameSchema', () => {
  test('should validate a valid site name', () => {
    const { error } = siteNameSchema.validate({ siteName: 'Valid Site Name' })

    expect(error).toBeUndefined()
  })

  test('should validate a site name at max length', () => {
    const { error } = siteNameSchema.validate({ siteName: 'A'.repeat(250) })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = siteNameSchema.validate({})

    expect(error.message).toBe('SITE_NAME_REQUIRED')
  })

  test('should fail on empty string', () => {
    const { error } = siteNameSchema.validate({ siteName: '' })

    expect(error.message).toBe('SITE_NAME_REQUIRED')
  })

  test('should fail when site name exceeds max length', () => {
    const { error } = siteNameSchema.validate({ siteName: 'A'.repeat(251) })

    expect(error.message).toBe('SITE_NAME_MAX_LENGTH')
  })
})
