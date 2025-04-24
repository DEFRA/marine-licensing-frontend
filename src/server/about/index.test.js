import { about } from '~/src/server/about/index.js'

describe('about route', () => {
  test('route is registered correctly', () => {
    const server = {
      route: jest.fn()
    }

    about.plugin.register(server)

    expect(server.route).toHaveBeenCalled()
    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/about'
      })
    ])
  })
})
