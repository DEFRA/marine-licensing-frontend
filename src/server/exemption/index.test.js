import { exemption } from '~/src/server/exemption/index.js'

describe('exemption route', () => {
  test('route is registered correctly', () => {
    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    expect(server.route).toHaveBeenCalledTimes(1)
    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/project-name'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/project-name'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption'
      })
    ])
  })
})
