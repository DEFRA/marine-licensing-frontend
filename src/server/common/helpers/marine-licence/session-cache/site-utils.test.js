import { vi } from 'vitest'
import {
  validateSiteAndActivityParams,
  validateSiteParam,
  validateSiteRequiredParam
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

describe('#validateSiteParam', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('redirects when site does not exist in cache', () => {
    const request = createMockRequest({ query: { site: '99' } })
    const mockTakeover = vi.fn()
    const h = createMockH({
      redirect: vi.fn().mockReturnValue({ takeover: mockTakeover })
    })

    validateSiteParam.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(mockTakeover).toHaveBeenCalled()
  })

  test('continues when site is valid', () => {
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    const result = validateSiteParam.method(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })
})

describe('#validateSiteRequiredParam', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('redirects when site param is missing', () => {
    const request = createMockRequest({ query: {} })
    const h = createMockH()

    validateSiteRequiredParam.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('redirects when site does not exist in cache', () => {
    const request = createMockRequest({ query: { site: '99' } })
    const h = createMockH()

    validateSiteRequiredParam.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('continues when site is valid', () => {
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    const result = validateSiteRequiredParam.method(request, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
  })
})
