import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#preLoginCheckSetupEmployeeSubmitController', () => {
  const getServer = setupTestServer()

  test('should redirect to the next page on success', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer(),
      formData: { checkSetupEmployee: 'yes' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.preLogin.CHECK_SETUP_EMPLOYEE)
  })
})
