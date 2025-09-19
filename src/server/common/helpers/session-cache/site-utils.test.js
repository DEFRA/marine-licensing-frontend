import { setSiteData } from '~/src/server/common/helpers/session-cache/site-utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#siteUtils', () => {
  beforeAll(() => {
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
    mockExemption.multipleSiteDetails.multipleSitesEnabled = true
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
