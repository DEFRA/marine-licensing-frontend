import { vi } from 'vitest'
import {
  publicRegisterBrowse,
  publicRegisterBrowseRoutes
} from '#src/server/public-register/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('publicRegisterBrowseRoutes', () => {
  test('route is registered correctly', () => {
    expect(publicRegisterBrowseRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: routes.PUBLIC_REGISTER_BROWSE,
        options: {
          auth: false
        }
      })
    ])
  })

  test('plugin registers the browse routes', () => {
    const server = {
      route: vi.fn()
    }

    publicRegisterBrowse.plugin.register(server)

    expect(server.route).toHaveBeenCalledWith(publicRegisterBrowseRoutes)
  })
})
