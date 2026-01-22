import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'

describe('getSiteDetailsBySite', () => {
  const mockMultiSiteExemption = {
    ...mockExemption,
    multipleSiteDetails: {
      ...mockExemption.multipleSiteDetails,
      multipleSitesEnabled: true
    },
    siteDetails: [mockExemption.siteDetails[0], mockExemption.siteDetails[1]]
  }

  test('should correctly return the first array element when index not specified', () => {
    const site = getSiteDetailsBySite(mockMultiSiteExemption)
    expect(site).toEqual(mockExemption.siteDetails[0])
  })

  test('should correctly return the specified site', () => {
    const site = getSiteDetailsBySite(mockMultiSiteExemption, 1)
    expect(site).toEqual(mockExemption.siteDetails[1])
  })

  test('should correctly handle no existing data for multiple sites', () => {
    const site = getSiteDetailsBySite({
      ...mockMultiSiteExemption,
      siteDetails: []
    })
    expect(site).toEqual({})
  })

  test('should correctly return the first array element when in single site journey', () => {
    const site = getSiteDetailsBySite(mockExemption)
    expect(site).toEqual(mockExemption.siteDetails[0])
  })

  test('should correctly handle no existing data for single sites', () => {
    const site = getSiteDetailsBySite({ ...mockExemption, siteDetails: [] })
    expect(site).toEqual({})
  })
})
