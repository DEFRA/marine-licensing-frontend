import { privacy } from '~/src/server/help/privacy/index.js'

describe('privacy route', () => {
  test('route is registered correctly', () => {
    const server = {
      route: jest.fn()
    }

    privacy.plugin.register(server)

    expect(server.route).toHaveBeenCalled()
    expect(server.route).toHaveBeenCalledWith([
      expect.objectContaining({
        method: 'GET',
        path: '/help/privacy',
        options: {
          auth: false
        }
      })
    ])
  })
})
