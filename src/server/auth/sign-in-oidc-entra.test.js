import { createServer } from '~/src/server/index.js'
import {
  redirectPathCacheKey,
  routes
} from '~/src/server/common/constants/routes.js'
import { setUserSession } from '~/src/server/auth/utils.js'
import { signInOidcEntraController } from '~/src/server/auth/sign-in-oidc-entra.js'
import { config } from '~/src/config/config.js'

jest.mock('~/src/server/auth/utils.js', () => ({
  setUserSession: jest.fn()
}))

describe('#signInOidcEntraController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('should call setUserSession', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      },
      logger: { info: jest.fn() },
      yar: { flash: jest.fn().mockReturnValue([routes.PROJECT_NAME]) }
    }

    const mockH = { redirect: jest.fn() }

    config.set('entraId.authEnabled', true)

    await signInOidcEntraController.handler(mockRequest, mockH)

    expect(setUserSession).toHaveBeenCalledWith(mockRequest)
  })

  test('should use request.yar.flash to get referrer and redirect to it', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: jest.fn().mockReturnValue(customRedirectRoute) },
      logger: { info: jest.fn() }
    }

    const mockH = { redirect: jest.fn() }

    await signInOidcEntraController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith(redirectPathCacheKey)
    expect(mockH.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })
})
