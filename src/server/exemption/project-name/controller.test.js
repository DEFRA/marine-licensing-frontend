import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'

describe('#projectNameController', () => {
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
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/project-name'
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should provide expected response with valid data', async () => {
    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/project-name'
    })

    expect(result).toEqual(
      expect.stringContaining(`Project name | ${config.get('serviceName')}`)
    )
    expect(statusCode).toBe(statusCodes.ok)
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
