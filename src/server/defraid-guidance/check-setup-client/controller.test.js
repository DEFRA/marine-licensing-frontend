import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#defraIdGuidanceCheckSetupClientSubmitController', () => {
  const getServer = setupTestServer()

  test('should redirect to signin if the client has linked the user', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer(),
      formData: { checkSetupClient: 'yes' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.SIGNIN)
  })

  test('should redirect to add-to-client-account if the client has not linked the user', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.defraIdGuidance.CHECK_SETUP_CLIENT,
      server: getServer(),
      formData: { checkSetupClient: 'no' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.defraIdGuidance.ADD_TO_CLIENT_ACCOUNT)
  })
})
