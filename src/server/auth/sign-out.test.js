import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'
import {
  getUserSession,
  removeUserSession
} from '~/src/server/common/plugins/auth/utils.js'
import { clearExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: jest.fn(),
  removeUserSession: jest.fn()
}))

describe('#signOutController', () => {
  let server

  const clearExemptionCacheMock = jest.mocked(clearExemptionCache)

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

  test('should render the project name page when no auth user', async () => {
    getUserSession.mockReturnValueOnce(null)

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: routes.SIGN_OUT
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should render the project name page when no auth config', async () => {
    getUserSession.mockReturnValueOnce({})
    config.set('defraId.authEnabled', false)

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: routes.SIGN_OUT
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should render remove session and redirect when user is logged in', async () => {
    getUserSession.mockReturnValueOnce({
      logoutUrl: 'testLogout',
      idToken: 'testId'
    })
    config.set('defraId.authEnabled', true)

    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: routes.SIGN_OUT
    })

    expect(removeUserSession).toHaveBeenCalled()
    expect(clearExemptionCacheMock).toHaveBeenCalled()
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(
      `testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000${routes.PROJECT_NAME}`
    )
  })
})
