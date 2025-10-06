import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'

describe('#serveStaticFiles', () => {
  const getServer = setupTestServer()

  describe('When secure context is disabled', () => {
    test('Should serve favicon as expected', async () => {
      const { statusCode } = await makeGetRequest({
        url: '/favicon.ico',
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await makeGetRequest({
        url: '/public/assets/images/govuk-crest.svg',
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
