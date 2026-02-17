import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#defraIdGuidanceAddToClientAccountController', () => {
  const getServer = setupTestServer()

  test('should return 200 for the add to client account page', async () => {
    const { statusCode } = await makeGetRequest({
      url: routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT,
      server: getServer()
    })

    expect(statusCode).toBe(200)
  })
})
