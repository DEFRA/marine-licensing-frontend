import { exemption } from '~/src/server/exemption/index.js'

describe('exemption route', () => {
  const expectedRoutes = [
    ['GET', '/exemption/project-name'],
    ['POST', '/exemption/project-name'],
    ['GET', '/exemption/public-register'],
    ['POST', '/exemption/public-register'],
    ['GET', '/exemption/task-list'],
    ['GET', '/exemption/how-do-you-want-to-provide-the-coordinates'],
    ['POST', '/exemption/how-do-you-want-to-provide-the-coordinates'],
    ['GET', '/exemption/how-do-you-want-to-enter-the-coordinates'],
    ['POST', '/exemption/how-do-you-want-to-enter-the-coordinates'],
    ['GET', '/exemption/what-coordinate-system'],
    ['POST', '/exemption/what-coordinate-system'],
    ['GET', '/exemption/enter-the-coordinates-at-the-centre-point'],
    ['POST', '/exemption/enter-the-coordinates-at-the-centre-point'],
    ['GET', '/exemption/enter-multiple-coordinates'],
    ['POST', '/exemption/enter-multiple-coordinates'],
    ['GET', '/exemption/width-of-site'],
    ['POST', '/exemption/width-of-site'],
    ['GET', '/exemption/review-site-details'],
    ['POST', '/exemption/review-site-details'],
    ['GET', '/exemption/choose-file-type-to-upload'],
    ['POST', '/exemption/choose-file-type-to-upload'],
    ['GET', '/exemption/activity-dates'],
    ['POST', '/exemption/activity-dates'],
    ['GET', '/exemption/activity-description'],
    ['POST', '/exemption/activity-description'],
    ['GET', '/exemption/check-your-answers'],
    ['POST', '/exemption/check-your-answers'],
    ['GET', '/exemption/confirmation'],
    ['GET', '/exemption']
  ]

  test('routes are registered correctly', () => {
    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    expect(server.route).toHaveBeenCalledTimes(1)
    expect(server.route).toHaveBeenCalledWith(
      expectedRoutes.map(([method, path]) =>
        expect.objectContaining({ method, path })
      )
    )
  })

  it.each(expectedRoutes)('registers %s %s route', (method, path) => {
    const server = {
      route: jest.fn()
    }

    exemption.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const routeExists = registeredRoutes.some(
      (route) => route.method === method && route.path === path
    )

    expect(routeExists).toBe(true)
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
