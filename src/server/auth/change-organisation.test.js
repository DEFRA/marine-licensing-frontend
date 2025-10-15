import { statusCodes } from '#src/server/common/constants/status-codes.js'
import {
  changeOrganisationQueryParam,
  routes
} from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#changeOrganisationController', () => {
  const getServer = setupTestServer()

  test('should redirect to sign-in with query parameter', async () => {
    const server = getServer()
    const { statusCode, headers } = await makeGetRequest({
      url: routes.CHANGE_ORGANISATION,
      server
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(
      `${routes.SIGNIN}?${changeOrganisationQueryParam}=true`
    )
  })
})
