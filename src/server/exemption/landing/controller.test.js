import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import {
  citizenUserSession,
  employeeSession
} from '~/tests/integration/shared/session-fixtures.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('#exemptionLanding', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getUserSession).mockResolvedValue(employeeSession)
  })

  describe('#exemptionLandingController', () => {
    test('Should go to correct page for Individual users', async () => {
      vi.mocked(getUserSession).mockResolvedValue(citizenUserSession)

      const { headers, statusCode } = await makeGetRequest({
        url: routes.EXEMPTION,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.postLogin.CONFIRM_INDIVIDUAL)
    })

    test('Should go to correct page for other users', async () => {
      const { headers, statusCode } = await makeGetRequest({
        url: routes.EXEMPTION,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.PROJECT_NAME)
    })
  })
})
