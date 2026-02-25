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
import { cacheMcmsContextFromQueryParams } from '~/src/server/common/helpers/mcms-context/cache-mcms-context.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')

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

    test('Should go to correct page for Employee users', async () => {
      vi.mocked(getUserSession).mockResolvedValue(employeeSession)

      const { headers, statusCode } = await makeGetRequest({
        url: routes.EXEMPTION,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.postLogin.CONFIRM_EMPLOYEE)
    })

    test('Should go to correct page for other users', async () => {
      vi.mocked(getUserSession).mockResolvedValue({
        ...employeeSession,
        userRelationshipType: 'newUserType'
      })

      const { headers, statusCode } = await makeGetRequest({
        url: routes.EXEMPTION,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.redirect)
      expect(headers.location).toBe(routes.PROJECT_NAME)
    })

    test('Should cache MCMS context when ACTIVITY_TYPE query param is present', async () => {
      await makeGetRequest({
        url: `${routes.EXEMPTION}?ACTIVITY_TYPE=CON&ARTICLE=17`,
        server: getServer()
      })

      expect(cacheMcmsContextFromQueryParams).toHaveBeenCalledTimes(1)
    })

    test('Should not call cacheMcmsContextFromQueryParams when ACTIVITY_TYPE is absent', async () => {
      vi.mocked(cacheMcmsContextFromQueryParams).mockClear()

      await makeGetRequest({
        url: routes.EXEMPTION,
        server: getServer()
      })

      expect(cacheMcmsContextFromQueryParams).not.toHaveBeenCalled()
    })
  })
})
