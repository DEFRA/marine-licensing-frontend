import {
  getSiteDetailsBySite,
  setSiteData
} from '~/src/server/common/helpers/session-cache/site-utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#siteUtils', () => {
  beforeAll(() => {
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
    mockExemption.multipleSiteDetails.multipleSitesEnabled = true
  })

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

  describe('setSiteData', () => {
    const mockRequest = {
      yar: {
        get: jest.fn()
      }
    }

    test('should correctly return site data for first site', () => {
      const site = setSiteData(mockRequest)
      expect(site).toEqual({
        queryParams: '',
        siteNumber: 1,
        siteIndex: 0,
        siteDetails: mockExemption.siteDetails[0]
      })
    })

    test('should correctly return site data for additional site', () => {
      const site = setSiteData({ ...mockRequest, query: { site: '2' } })
      expect(site).toEqual({
        queryParams: '?site=2',
        siteNumber: 2,
        siteIndex: 1,
        siteDetails: mockExemption.siteDetails[1]
      })
    })
  })
})
