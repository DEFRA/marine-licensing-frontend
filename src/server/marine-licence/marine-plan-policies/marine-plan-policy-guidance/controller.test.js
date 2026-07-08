import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#marinePlanPolicyGuidanceController', () => {
  const getServer = setupTestServer()

  test('Should provide expected response', async () => {
    const { result, statusCode } = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
      server: getServer()
    })

    expect(result).toEqual(
      expect.stringContaining('Marine plan policies guidance')
    )
    expect(statusCode).toBe(statusCodes.ok)
  })
})
