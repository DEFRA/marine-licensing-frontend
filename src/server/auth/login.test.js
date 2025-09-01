import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { routes } from '~/src/server/common/constants/routes.js'

describe('#loginController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('should render the project name page', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: routes.LOGIN
    })

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(routes.PROJECT_NAME)
  })
})
