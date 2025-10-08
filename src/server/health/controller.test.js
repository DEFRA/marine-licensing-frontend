import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'

import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#healthController', () => {
  const getServer = setupTestServer()

  test('Should provide expected response', async () => {
    const { result, statusCode } = await makeGetRequest({
      url: '/health',
      server: getServer()
    })

    expect(result).toEqual({ message: 'success' })
    expect(statusCode).toBe(statusCodes.ok)
  })
})
