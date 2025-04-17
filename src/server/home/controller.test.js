import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

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

  test('Should provide expected response', async () => {
    const { headers, statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe('/exemption')
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
