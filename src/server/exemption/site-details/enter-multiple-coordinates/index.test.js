import { enterMultipleCoordinatesRoutes } from '#src/server/exemption/site-details/enter-multiple-coordinates/index.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('Enter Multiple Coordinates Routes', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(enterMultipleCoordinatesRoutes)).toBe(true)
    expect(enterMultipleCoordinatesRoutes).toHaveLength(2)
  })

  it('should include GET route for enter multiple coordinates', () => {
    const getRoute = enterMultipleCoordinatesRoutes.find(
      (route) => route.method === 'GET'
    )

    expect(getRoute).toBeDefined()
    expect(getRoute.path).toBe(routes.ENTER_MULTIPLE_COORDINATES)
    expect(getRoute.handler).toBeDefined()
  })

  it('should include POST route for enter multiple coordinates', () => {
    const postRoute = enterMultipleCoordinatesRoutes.find(
      (route) => route.method === 'POST'
    )

    expect(postRoute).toBeDefined()
    expect(postRoute.path).toBe(routes.ENTER_MULTIPLE_COORDINATES)
    expect(postRoute.handler).toBeDefined()
  })

  it('should have correct route paths', () => {
    enterMultipleCoordinatesRoutes.forEach((route) => {
      expect(route.path).toBe('/exemption/enter-multiple-coordinates')
    })
  })
})
