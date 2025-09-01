import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'

describe('#homeController', () => {
  /** @type {Server} */
  let server
  let clearExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    clearExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'clearExemptionCache')
      .mockImplementation(() => ({}))
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should redirect to exemption and clear exemption cache when no referer header', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCacheSpy).toHaveBeenCalledWith(expect.any(Object))
  })

  test('Should redirect to dashboard when coming from account management page', async () => {
    const { accountManagementUrl } = config.get('defraId')

    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        referer: `${accountManagementUrl}`
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.DASHBOARD)
    expect(clearExemptionCacheSpy).not.toHaveBeenCalled()
  })

  test('Should redirect to exemption and clear exemption cache when referer is not from account management page', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        referer: 'http://localhost:3000'
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
    expect(clearExemptionCacheSpy).toHaveBeenCalledWith(expect.any(Object))
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
