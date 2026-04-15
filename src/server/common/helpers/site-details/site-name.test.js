import { getSiteDataFromParam, hasInvalidSiteNumber } from './site-name.js'

describe('#site name utils', () => {
  describe('#getSiteDataFromParam', () => {
    test('returns correct values when site and activity params are provided', () => {
      const result = getSiteDataFromParam({ site: '2', activity: '3' })
      expect(result).toEqual({
        siteIndex: 1,
        siteNumber: 2,
        activityDetailsIndex: 2,
        activityDetailsNumber: 3
      })
    })

    test('returns defaults when called with all undefined value', () => {
      const result = getSiteDataFromParam(undefined)
      expect(result).toEqual({
        siteIndex: 0,
        siteNumber: 1
      })
    })
  })

  describe('#hasInvalidSiteNumber', () => {
    test('correctly returns with invalid site number in URL params', async () => {
      const isInvalid = hasInvalidSiteNumber(10, [{}, {}])
      expect(isInvalid).toBeTruthy()
    })
    test('correctly returns with valid site number in URL params when editing', async () => {
      const isInvalid = hasInvalidSiteNumber(1, [{}, {}])
      expect(isInvalid).toBeFalsy()
    })
    test('correctly returns with valid site number in URL params when adding', async () => {
      const isInvalid = hasInvalidSiteNumber(3, [{}, {}])
      expect(isInvalid).toBeFalsy()
    })
  })
})
