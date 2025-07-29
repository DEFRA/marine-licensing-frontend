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
        path: '/exemption/task-list/{exemptionId}'
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
        path: '/exemption/width-of-site'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/width-of-site'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/enter-multiple-coordinates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/enter-multiple-coordinates'
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
        path: '/exemption/choose-file-type-to-upload'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/choose-file-type-to-upload'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/upload-file'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/upload-and-wait'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/activity-dates'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/activity-dates'
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
        path: '/exemption/check-your-answers'
      }),
      expect.objectContaining({
        method: 'POST',
        path: '/exemption/check-your-answers'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption/confirmation'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/home'
      }),
      expect.objectContaining({
        method: 'GET',
        path: '/exemption'
      })
    ])
  })

  test('handler should redirect to /exemption/project-name', () => {
    expect.assertions(1)

    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    // Get the actual handler from the registered routes
    const registeredRoutes = server.route.mock.calls[0][0]
    const exemptionRoute = registeredRoutes.find(
      (route) => route.method === 'GET' && route.path === '/exemption'
    )

    const mockRequest = {}
    const mockToolkit = {
      redirect: jest.fn()
    }

    exemptionRoute.handler(mockRequest, mockToolkit)

    expect(mockToolkit.redirect).toHaveBeenCalledWith('/exemption/project-name')
  })
})
