import { makePostRequest } from '#src/server/test-helpers/server-requests.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'

describe('#preLoginCheckSetupEmployeeSubmitController', () => {
  const getServer = setupTestServer()

  test('should redirect to signin if the user already has an account', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer(),
      formData: { checkSetupEmployee: 'yes' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.SIGNIN)
  })

  test('should redirect to register new org page if user needs to create a new account', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer(),
      formData: { checkSetupEmployee: 'register-new' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.preLogin.REGISTER_NEW_ORG)
  })

  test('should redirect if user needs to be added to an existing organisation', async () => {
    const { statusCode, headers } = await makePostRequest({
      url: routes.preLogin.CHECK_SETUP_EMPLOYEE,
      server: getServer(),
      formData: { checkSetupEmployee: 'need-to-be-added' }
    })

    expect(statusCode).toBe(302)

    expect(headers.location).toBe(routes.preLogin.ADD_TO_ORG_ACCOUNT)
  })
})
