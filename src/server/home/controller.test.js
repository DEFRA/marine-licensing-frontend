import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('#homeController', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should redirect to exemption when no referer header', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
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
  })

  test('Should redirect to exemption when referer is not from account management page', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/',
      headers: {
        referer: 'http://localhost:3000'
      }
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
