import { beforeYouStartRoutes } from '#src/server/exemption/site-details/before-you-start/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('#beforeYouStartRoutes', () => {
  test('should export an array of routes', () => {
    expect(Array.isArray(beforeYouStartRoutes)).toBe(true)
  })

  test('should have a GET route for the before you start page', () => {
    const getRoute = beforeYouStartRoutes.find(
      (route) => route.method === 'GET'
    )

    expect(getRoute).toBeDefined()
    expect(getRoute.path).toBe(routes.SITE_DETAILS)
  })
})
