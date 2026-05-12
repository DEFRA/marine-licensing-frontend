import { vi } from 'vitest'
import {
  validateSiteAndActivityParams,
  setSiteData,
  setSiteDataPreHandler
} from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as utils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('#validateSiteAndActivityParams', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('redirects when site param is missing', () => {
    const request = createMockRequest({ query: { activity: '1' } })
    const h = createMockH()

    validateSiteAndActivityParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects when activity param is missing', () => {
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    validateSiteAndActivityParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects when site does not exist in cache', () => {
    const request = createMockRequest({ query: { site: '99', activity: '1' } })
    const h = createMockH()

    validateSiteAndActivityParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects when activity does not exist for site', () => {
    const request = createMockRequest({ query: { site: '1', activity: '99' } })
    const h = createMockH()

    validateSiteAndActivityParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('continues when site and activity are valid', () => {
    const request = createMockRequest({ query: { site: '1', activity: '1' } })
    const h = createMockH()

    const result = validateSiteAndActivityParams.method(request, h)

    expect(result).toBe(h.continue)
  })
})

describe('#setSiteData', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('returns site data for site 1 with no query param', () => {
    const request = createMockRequest()
    const result = setSiteData(request)

    expect(result).toEqual({
      siteIndex: 0,
      siteNumber: 1,
      queryParams: '',
      siteDetails: mockMarineLicenceApplication.siteDetails[0]
    })
  })

  test('returns site data with queryParams when site > 1', () => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: [
        mockMarineLicenceApplication.siteDetails[0],
        { siteName: 'Site 2' }
      ]
    })
    const request = createMockRequest({ query: { site: '2' } })
    const result = setSiteData(request)

    expect(result).toEqual({
      siteIndex: 1,
      siteNumber: 2,
      queryParams: '?site=2',
      siteDetails: { siteName: 'Site 2' }
    })
  })

  test('returns undefined for an invalid site number', () => {
    const request = createMockRequest({ query: { site: '99' } })
    const result = setSiteData(request)

    expect(result).toBeUndefined()
  })

  test('returns site data when adding a new site (siteNumber === siteDetails.length + 1)', () => {
    const request = createMockRequest({ query: { site: '2' } })
    const result = setSiteData(request)

    expect(result).toEqual({
      siteIndex: 1,
      siteNumber: 2,
      queryParams: '?site=2',
      siteDetails: {}
    })
  })
})

describe('#setSiteDataPreHandler', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('sets request.site and returns h.continue for valid site', () => {
    const request = createMockRequest()
    const h = createMockH()

    const result = setSiteDataPreHandler.method(request, h)

    expect(request.site).toEqual({
      siteIndex: 0,
      siteNumber: 1,
      queryParams: '',
      siteDetails: mockMarineLicenceApplication.siteDetails[0]
    })
    expect(result).toBe(h.continue)
  })

  test('redirects to task list for an invalid site number', () => {
    const request = createMockRequest({ query: { site: '99' } })
    const mockTakeover = vi.fn()
    const h = createMockH({
      redirect: vi.fn().mockReturnValue({ takeover: mockTakeover })
    })

    setSiteDataPreHandler.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(mockTakeover).toHaveBeenCalled()
  })
})
