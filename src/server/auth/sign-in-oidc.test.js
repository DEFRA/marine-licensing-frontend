import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { setUserSession } from '~/src/server/auth/utils.js'
import { signInOidcController } from '~/src/server/auth/sign-in-oidc.js'
import { config } from '~/src/config/config.js'

jest.mock('~/src/server/auth/utils.js', () => ({
  setUserSession: jest.fn()
}))

describe('#signInOidcController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('should render the project name page', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: routes.LOGIN
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should call setUserSession when auth is enabled and user is authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      },
      logger: { info: jest.fn() },
      yar: { flash: jest.fn().mockReturnValue([routes.PROJECT_NAME]) }
    }

    const mockH = { redirect: jest.fn() }

    config.set('defraId.authEnabled', true)

    await signInOidcController.handler(mockRequest, mockH)

    expect(setUserSession).toHaveBeenCalledWith(mockRequest)
  })

  test('should use request.yar.flash to get referrer and redirect to it', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: jest.fn().mockReturnValue([customRedirectRoute]) }
    }

    const mockH = { redirect: jest.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('referrer')
    expect(mockH.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })

  test('should fall back to PROJECT_NAME route when no referrer in flash', async () => {
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: jest.fn().mockReturnValue([]) }
    }

    const mockH = { redirect: jest.fn() }

    await signInOidcController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('referrer')
    expect(mockH.redirect).toHaveBeenCalledWith(routes.PROJECT_NAME)
  })
})
