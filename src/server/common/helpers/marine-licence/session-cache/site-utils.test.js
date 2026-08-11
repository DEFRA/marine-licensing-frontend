import { vi } from 'vitest'
import {
  validateSiteAndActivityParams,
  validateSiteAndDrawingParams,
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

describe('#validateSiteAndDrawingParams', () => {
  beforeEach(() => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  test('redirects when site param is missing', () => {
    const request = createMockRequest({ query: { drawing: '1' } })
    const mockTakeover = vi.fn()
    const h = createMockH({
      redirect: vi.fn().mockReturnValue({ takeover: mockTakeover })
    })

    validateSiteAndDrawingParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(mockTakeover).toHaveBeenCalled()
  })

  test('redirects when drawing param is missing', () => {
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    validateSiteAndDrawingParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test.each([
    {
      name: 'redirects when site does not exist in cache',
      query: { site: '99', drawing: '1' }
    },
    {
      name: 'redirects when the drawing index does not exist for the site',
      query: { site: '1', drawing: '2' }
    },
    {
      name: 'redirects when drawing number is zero',
      query: { site: '1', drawing: '0' }
    }
  ])('$name', ({ query }) => {
    const request = createMockRequest({ query })
    const h = createMockH()

    validateSiteAndDrawingParams.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('continues for drawing 1 even when no drawings exist yet', () => {
    const request = createMockRequest({ query: { site: '1', drawing: '1' } })
    const h = createMockH()

    const result = validateSiteAndDrawingParams.method(request, h)

    expect(result).toBe(h.continue)
  })

  test('continues for an existing drawing index', () => {
    vi.spyOn(utils, 'getMarineLicenceCache').mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          constructionDrawings: [{ filename: 'a.pdf' }, { filename: 'b.pdf' }]
        }
      ]
    })
    const request = createMockRequest({ query: { site: '1', drawing: '2' } })
    const h = createMockH()

    const result = validateSiteAndDrawingParams.method(request, h)

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
