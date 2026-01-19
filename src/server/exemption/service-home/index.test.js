import { serviceHomeRoutes } from '#src/server/exemption/service-home/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('serviceHomeRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(serviceHomeRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: routes.SERVICE_HOME
      })
    )
  })
})
