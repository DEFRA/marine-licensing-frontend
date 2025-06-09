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
        path: '/exemption/public-register'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/public-register'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/task-list'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/how-do-you-want-to-provide-the-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/how-do-you-want-to-provide-the-coordinates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/how-do-you-want-to-enter-the-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/how-do-you-want-to-enter-the-coordinates'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/what-coordinate-system'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/what-coordinate-system'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/enter-the-coordinates-at-the-centre-point'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/enter-the-coordinates-at-the-centre-point'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/review-site-details'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/review-site-details'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/activity-description'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/activity-description'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption'
      })
    ])
  })

  test('handler should redirect to /exemption/project-name', () => {
    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    expect(server.route).toHaveBeenCalled()

    const routes = server.route.mock.calls[0][0]

    const handler = routes.at(-1).handler

    const redirectSpy = jest.fn().mockReturnValue('redirected')

    const mockHandler = {
      redirect: redirectSpy
    }

    handler({}, mockHandler)

    expect(redirectSpy).toHaveBeenCalledWith('/exemption/project-name')
  })
})
