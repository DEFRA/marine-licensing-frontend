import { vi } from 'vitest'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getUserSession,
  removeUserSession
} from '~/src/server/common/plugins/auth/utils.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: vi.fn(),
  removeUserSession: vi.fn()
}))

describe('#signOutController', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render the project name page when no auth user', async () => {
    getUserSession.mockReturnValue(null)

    const { statusCode, headers } = await makeGetRequest({
      url: routes.SIGN_OUT,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })

  test('should render remove session and redirect when user is logged in', async () => {
    getUserSession.mockReturnValue({
      logoutUrl: 'testLogout',
      idToken: 'testId'
    })

    const { statusCode, headers } = await makeGetRequest({
      url: routes.SIGN_OUT,
      server: getServer()
    })

    expect(removeUserSession).toHaveBeenCalled()
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(
      `testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000${routes.PROJECT_NAME}`
    )
  })
})
