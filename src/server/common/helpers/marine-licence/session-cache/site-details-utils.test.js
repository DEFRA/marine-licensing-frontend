import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'

describe('getSiteDetailsBySite', () => {
  test('should correctly return the first array element when index not specified', () => {
    const site = getSiteDetailsBySite(mockMarineLicenceApplication)
    expect(site).toEqual(mockMarineLicenceApplication.siteDetails[0])
  })

  test('should correctly return the specified site', () => {
    const mockMultiSiteMarineLicence = {
      ...mockMarineLicenceApplication,
      siteDetails: [
        mockMarineLicenceApplication.siteDetails[0],
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          siteName: 'second site'
        }
      ]
    }
    const site = getSiteDetailsBySite(mockMultiSiteMarineLicence, 1)
    expect(site).toEqual(mockMultiSiteMarineLicence.siteDetails[1])
  })

  test('should correctly handle no existing data', () => {
    const site = getSiteDetailsBySite({})
    expect(site).toEqual({})
  })
})
