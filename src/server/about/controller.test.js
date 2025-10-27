import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#aboutController', () => {
  const getServer = setupTestServer()

  test('Should provide expected response', async () => {
    const { result, statusCode } = await makeGetRequest({
      url: '/about',
      server: getServer()
    })

    expect(result).toEqual(expect.stringContaining('About -'))
    expect(statusCode).toBe(statusCodes.ok)
  })
})
