import { vi } from 'vitest'
import { serviceHome } from '#src/server/service-home/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('service-home route', () => {
  test('route is registered correctly', () => {
    const server = {
      route: vi.fn()
    }

    serviceHome.plugin.register(server)

    expect(server.route).toHaveBeenCalled()
    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: routes.SERVICE_HOME
      })
    ])
  })
})
