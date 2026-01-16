import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { clearExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
import {
  cacheMcmsContextFromQueryParams,
  getMcmsContextFromCache
} from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'

vi.mock(
  '~/src/server/common/helpers/session-cache/utils.js',
  async (importOriginal) => {
    const mod = await importOriginal()
    return {
      ...mod,
      clearExemptionCache: vi.fn()
    }
  }
)
vi.mock('#src/server/common/helpers/mcms-context/cache-mcms-context.js')

describe('#homeController', () => {
  const getServer = setupTestServer()

  test('should redirect to new exemption and cache MCMS context, if URL has a IAT query string', async () => {
    const { headers, statusCode } = await makeGetRequest({
      url: '/?ACTIVITY_TYPE=deposit',
      server: getServer(),
      headers: {
        referer: 'http://localhost:3000'
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCache).toHaveBeenCalled()
    expect(cacheMcmsContextFromQueryParams).toHaveBeenCalled()
  })

  test("should redirect to new exemption and not cache MCMS if user there's no IAT query string, but there is MCMS context already in cache", async () => {
    getMcmsContextFromCache.mockReturnValue({})
    const { headers, statusCode } = await makeGetRequest({
      url: '/',
      server: getServer()
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCache).toHaveBeenCalled()
    expect(cacheMcmsContextFromQueryParams).not.toHaveBeenCalled()
  })

  test('should redirect to dashboard when coming to / from account management page', async () => {
    const { accountManagementUrl } = config.get('defraId')

    const { headers, statusCode } = await makeGetRequest({
      url: '/',
      server: getServer(),
      headers: {
        referer: `${accountManagementUrl}`
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.SERVICE_HOME)
    expect(clearExemptionCache).not.toHaveBeenCalled()
  })

  test('should redirect to service home if a signed in user has come to / path without a IAT query string and MCMS context is not in cache', async () => {
    getMcmsContextFromCache.mockReturnValue(null)
    const { headers, statusCode } = await makeGetRequest({
      url: '/',
      server: getServer()
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/home')
    expect(clearExemptionCache).not.toHaveBeenCalled()
  })
})
