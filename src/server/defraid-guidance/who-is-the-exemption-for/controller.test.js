import { vi, describe, test, expect, beforeEach } from 'vitest'
import { routes } from '#src/server/common/constants/routes.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { defraIdGuidanceUserSession } from '#src/server/common/helpers/defraid-guidance/session-cache.js'
import {
  defraIdGuidanceWhoIsExemptionForController,
  defraIdGuidanceWhoIsExemptionForSubmitController,
  pathToPageTemplate,
  errorMessages
} from './controller.js'

vi.mock(
  '#src/server/common/helpers/mcms-context/cache-mcms-context.js',
  () => ({
    cacheMcmsContextFromQueryParams: vi.fn()
  })
)

vi.mock('#src/server/common/helpers/exemptions/session-cache/utils.js', () => ({
  clearExemptionCache: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('#src/server/common/helpers/defraid-guidance/session-cache.js', () => ({
  defraIdGuidanceUserSession: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  }
}))

const createMockRequest = (overrides = {}) => ({
  state: {},
  query: {},
  payload: {},
  ...overrides
})

const createMockH = () => ({
  redirect: vi.fn().mockReturnThis(),
  view: vi.fn().mockReturnThis()
})

describe('defraIdGuidanceWhoIsExemptionForController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('redirects to project name when user has session cookie', async () => {
      const request = createMockRequest({
        state: { userSession: { sessionId: 'test-session' } }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
      expect(h.view).not.toHaveBeenCalled()
    })

    test('renders view when no session cookie', async () => {
      const request = createMockRequest({ state: {} })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(pathToPageTemplate, {
        pageTitle: 'Who is this exempt activity notification for?',
        heading: 'Who is this exempt activity notification for?',
        whoIsExemptionFor: null
      })
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('pre-populates radio from session cache on back navigation', async () => {
      defraIdGuidanceUserSession.get.mockResolvedValueOnce('client')
      const request = createMockRequest({ state: {} })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(pathToPageTemplate, {
        pageTitle: 'Who is this exempt activity notification for?',
        heading: 'Who is this exempt activity notification for?',
        whoIsExemptionFor: 'client'
      })
    })

    test('renders view when state is undefined', async () => {
      const request = createMockRequest({ state: undefined })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(h.view).toHaveBeenCalled()
      expect(h.redirect).not.toHaveBeenCalled()
    })

    test('caches MCMS context when ACTIVITY_TYPE query param present', async () => {
      const request = createMockRequest({
        query: { ACTIVITY_TYPE: 'CON', ARTICLE: '17' }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(cacheMcmsContextFromQueryParams).toHaveBeenCalledWith(request)
    })

    test('does not cache MCMS context when ACTIVITY_TYPE query param absent', async () => {
      const request = createMockRequest({ query: {} })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(cacheMcmsContextFromQueryParams).not.toHaveBeenCalled()
    })

    test('clears exemption cache on page load', async () => {
      const request = createMockRequest()
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForController.handler(request, h)

      expect(clearExemptionCache).toHaveBeenCalledWith(request, h)
    })
  })
})

describe('defraIdGuidanceWhoIsExemptionForSubmitController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('has auth: false option', () => {
    expect(defraIdGuidanceWhoIsExemptionForSubmitController.options.auth).toBe(
      false
    )
  })

  describe('POST handler', () => {
    test('redirects to sign-in when individual selected', async () => {
      const request = createMockRequest({
        payload: { whoIsExemptionFor: 'individual' }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.SIGNIN)
    })

    test('redirects to check-setup-employee when organisation selected', async () => {
      const request = createMockRequest({
        payload: { whoIsExemptionFor: 'organisation' }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE
      )
    })

    test('redirects to check-setup-client when client selected', async () => {
      const request = createMockRequest({
        payload: { whoIsExemptionFor: 'client' }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.defraIdGuidance.CHECK_SETUP_CLIENT
      )
    })

    test('saves selection to session before redirecting', async () => {
      const request = createMockRequest({
        payload: { whoIsExemptionFor: 'organisation' }
      })
      const h = createMockH()

      await defraIdGuidanceWhoIsExemptionForSubmitController.handler(request, h)

      expect(defraIdGuidanceUserSession.set).toHaveBeenCalledWith({
        request,
        key: 'whoIsExemptionFor',
        value: 'organisation'
      })
    })
  })

  describe('validation', () => {
    test('validates whoIsExemptionFor is required', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({})

      expect(result.error).toBeDefined()
    })

    test('validates whoIsExemptionFor accepts individual', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({ whoIsExemptionFor: 'individual' })

      expect(result.error).toBeUndefined()
    })

    test('validates whoIsExemptionFor accepts organisation', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({ whoIsExemptionFor: 'organisation' })

      expect(result.error).toBeUndefined()
    })

    test('validates whoIsExemptionFor accepts client', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({ whoIsExemptionFor: 'client' })

      expect(result.error).toBeUndefined()
    })

    test('validates whoIsExemptionFor rejects invalid value', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({ whoIsExemptionFor: 'invalid' })

      expect(result.error).toBeDefined()
    })

    test('validates whoIsExemptionFor rejects empty string', () => {
      const schema =
        defraIdGuidanceWhoIsExemptionForSubmitController.options.validate
          .payload
      const result = schema.validate({ whoIsExemptionFor: '' })

      expect(result.error).toBeDefined()
    })
  })
})

describe('errorMessages', () => {
  test('contains WHO_IS_EXEMPTION_FOR_REQUIRED message', () => {
    expect(errorMessages.WHO_IS_EXEMPTION_FOR_REQUIRED).toBe(
      'Select who the exempt activity notification is for'
    )
  })
})

describe('pathToPageTemplate', () => {
  test('returns correct template path', () => {
    expect(pathToPageTemplate).toBe(
      'defraid-guidance/who-is-the-exemption-for/index'
    )
  })
})
