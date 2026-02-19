import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  redirectPathCacheKey,
  routes
} from '#src/server/common/constants/routes.js'
import { setUserSession } from '#src/server/auth/utils.js'
import { defraIdGuidanceUserSession } from '#src/server/common/helpers/defraid-guidance/session-cache.js'
import { signInOidcController } from '#src/server/auth/sign-in-oidc.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/auth/utils.js', () => ({
  setUserSession: vi.fn()
}))

vi.mock(
  '~/src/server/common/helpers/defraid-guidance/session-cache.js',
  () => ({
    defraIdGuidanceUserSession: {
      clear: vi.fn()
    }
  })
)

describe('#signInOidcController', () => {
  const getServer = setupTestServer()

  test('should render the project name page', async () => {
    const { statusCode, headers } = await makeGetRequest({
      url: routes.SIGNIN,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should call setUserSession when auth is enabled and user is authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      },
      logger: { info: vi.fn() },
      yar: { flash: vi.fn().mockReturnValue([routes.PROJECT_NAME]) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(setUserSession).toHaveBeenCalledWith(mockRequest)
    expect(defraIdGuidanceUserSession.clear).toHaveBeenCalledWith(mockRequest)
  })

  test('should not clear guidance cache when auth fails', async () => {
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue([routes.PROJECT_NAME]) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(defraIdGuidanceUserSession.clear).not.toHaveBeenCalled()
  })

  test('should use request.yar.flash to get referrer and redirect to it', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue(customRedirectRoute) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith(redirectPathCacheKey)
    expect(mockH.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })

  test('should use request.yar.flash to get an array of referrers and redirect to the first', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue([customRedirectRoute]) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith(redirectPathCacheKey)
    expect(mockH.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })

  test('should fall back to PROJECT_NAME route when no referrer in flash', async () => {
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue(null) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith(redirectPathCacheKey)
    expect(mockH.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
  })
})
