import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { clearExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'

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

describe('#homeController', () => {
  const getServer = setupTestServer()

  test('Should redirect to exemption and clear exemption cache when no referer header', async () => {
    const { headers, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/'
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCache).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })

  test('Should redirect to dashboard when coming from account management page', async () => {
    const { accountManagementUrl } = config.get('defraId')

    const { headers, statusCode } = await makeGetRequest({
      url: '/',
      server: getServer(),
      headers: {
        referer: `${accountManagementUrl}`
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.DASHBOARD)
    expect(clearExemptionCache).not.toHaveBeenCalled()
  })

  test('Should redirect to exemption and clear exemption cache when referer is not from account management page', async () => {
    const { headers, statusCode } = await makeGetRequest({
      url: '/',
      server: getServer(),
      headers: {
        referer: 'http://localhost:3000'
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCache).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    )
  })
})
