import { vi } from 'vitest'
import { setSiteData } from '#src/server/common/helpers/session-cache/site-utils.js'
import { mockExemption as mockExemptionData } from '#src/server/test-helpers/mocks.js'
import * as utils from '#src/server/common/helpers/session-cache/utils.js'

describe('#siteUtils', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getExemptionCache').mockReturnValue({
      ...mockExemptionData,
      multipleSiteDetails: {
        ...mockExemptionData.multipleSiteDetails,
        multipleSitesEnabled: true
      }
    })
  })

  const mockRequest = {
    yar: {
      get: vi.fn()
    }
  }

  test('should correctly return site data for first site', () => {
    const site = setSiteData(mockRequest)
    expect(site).toEqual({
      queryParams: '',
      siteNumber: 1,
      siteIndex: 0,
      siteDetails: mockExemptionData.siteDetails[0]
    })
  })

  test('should correctly return site data for additional site', () => {
    const site = setSiteData({ ...mockRequest, query: { site: '2' } })
    expect(site).toEqual({
      queryParams: '?site=2',
      siteNumber: 2,
      siteIndex: 1,
      siteDetails: mockExemptionData.siteDetails[1]
    })
  })
})
