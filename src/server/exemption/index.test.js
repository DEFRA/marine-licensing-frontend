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

  test('handler should redirect to /test', () => {
    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    expect(server.route).toHaveBeenCalled()

    const routes = server.route.mock.calls[0][0]
    const handler = routes[2].handler

    const redirectSpy = jest.fn().mockReturnValue('redirected')

    const mockHandler = {
      redirect: redirectSpy
    }

    handler({}, mockHandler)

    expect(redirectSpy).toHaveBeenCalledWith('/exemption/project-name')
  })
})
