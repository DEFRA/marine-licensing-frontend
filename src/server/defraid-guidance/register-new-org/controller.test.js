import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#defraIdGuidanceRegisterNewOrgController', () => {
  const getServer = setupTestServer()

  test('should return 200 for the register new org page', async () => {
    const { statusCode } = await makeGetRequest({
      url: routes.defraIdGuidance.REGISTER_NEW_ORG,
      server: getServer()
    })

    expect(statusCode).toBe(200)
  })
})
