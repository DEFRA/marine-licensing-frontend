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

  test('returns siteIndex 0 and siteDetails from first cache entry', () => {
    const request = createMockRequest()
    const result = setSiteData(request)

    expect(result.siteIndex).toBe(0)
    expect(result.siteDetails).toBe(mockMarineLicenceApplication.siteDetails[0])
  })
})

describe('#setSiteDataPreHandler', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('sets request.site and returns h.continue', () => {
    const request = createMockRequest()
    const h = createMockH()

    const result = setSiteDataPreHandler.method(request, h)

    expect(request.site).toEqual({
      siteIndex: 0,
      siteDetails: mockMarineLicenceApplication.siteDetails[0]
    })
    expect(result).toBe(h.continue)
  })
})
