import { finishedSiteDetailsSchema } from './schema.js'

describe('#finishedSiteDetailsSchema', () => {
  test('should fail when finishedEnteringSiteDetails is missing', () => {
    const result = finishedSiteDetailsSchema.validate({})
    expect(result.error.message).toContain('FINISHED_SITE_DETAILS_REQUIRED')
  })

  test('should fail when finishedEnteringSiteDetails is an invalid value', () => {
    const result = finishedSiteDetailsSchema.validate({
      finishedEnteringSiteDetails: 'maybe'
    })
    expect(result.error.message).toContain('FINISHED_SITE_DETAILS_REQUIRED')
  })

  test('should pass when finishedEnteringSiteDetails is yes', () => {
    const result = finishedSiteDetailsSchema.validate({
      finishedEnteringSiteDetails: 'yes'
    })
    expect(result.error).toBeUndefined()
  })

  test('should pass when finishedEnteringSiteDetails is no', () => {
    const result = finishedSiteDetailsSchema.validate({
      finishedEnteringSiteDetails: 'no'
    })
    expect(result.error).toBeUndefined()
  })

  test('should ignore unrelated payload fields from the shared review-site-details route', () => {
    const result = finishedSiteDetailsSchema.validate({
      finishedEnteringSiteDetails: 'yes',
      csrfToken: 'token'
    })
    expect(result.error).toBeUndefined()
  })
})
