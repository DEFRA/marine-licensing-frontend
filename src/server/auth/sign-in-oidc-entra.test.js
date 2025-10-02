import { vi } from 'vitest'
import {
  redirectPathCacheKey,
  routes
} from '~/src/server/common/constants/routes.js'
import { setUserSession } from '~/src/server/auth/utils.js'
import { signInOidcEntraController } from '~/src/server/auth/sign-in-oidc-entra.js'

vi.mock('~/src/server/auth/utils.js', () => ({
  setUserSession: vi.fn()
}))

describe('#signInOidcEntraController', () => {
  test('should call setUserSession', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      },
      logger: { info: vi.fn() },
      yar: { flash: vi.fn().mockReturnValue([routes.PROJECT_NAME]) }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcEntraController.handler(mockRequest, mockH)

    expect(setUserSession).toHaveBeenCalledWith(mockRequest)
  })

  test('should use request.yar.flash to get referrer and redirect to it', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue(customRedirectRoute) },
      logger: { info: vi.fn() }
    }

    const mockH = { redirect: vi.fn() }

    await signInOidcEntraController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith(redirectPathCacheKey)
    expect(mockH.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })
})
