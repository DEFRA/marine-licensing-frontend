import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#loginController', () => {
  const getServer = setupTestServer()

  test('should render the project name page', async () => {
    const { statusCode, headers } = await makeGetRequest({
      url: routes.SIGNIN,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })
})
