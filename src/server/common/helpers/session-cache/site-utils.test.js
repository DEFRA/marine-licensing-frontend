import { vi } from 'vitest'
import {
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/session-cache/site-utils.js'
import {
  createMockRequest,
  mockExemption as mockExemptionData
} from '#src/server/test-helpers/mocks.js'
import * as utils from '#src/server/common/helpers/session-cache/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

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

  const mockRequest = createMockRequest()

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

  test('should handle request without query object', () => {
    const site = setSiteData({ yar: { get: vi.fn() } })
    expect(site).toEqual({
      queryParams: '',
      siteNumber: 1,
      siteIndex: 0,
      siteDetails: mockExemptionData.siteDetails[0]
    })
  })

  test('should redirect user if they try to enter an invalid site', () => {
    const mockH = {
      redirect: vi.fn().mockReturnValue({
        takeover: vi.fn()
      })
    }
    const site = setSiteData({ ...mockRequest, query: { site: '10' } }, mockH)
    expect(site.siteNumber).toBeUndefined()
  })

  test('should redirect user if they try to enter an invalid site using preHandler', () => {
    const mockH = {
      redirect: vi.fn().mockReturnValue({
        takeover: vi.fn()
      })
    }
    setSiteDataPreHandler.method(
      { ...mockRequest, query: { site: '10' } },
      mockH
    )
    expect(mockH.redirect).toHaveBeenCalledWith(routes.TASK_LIST)
  })
})
