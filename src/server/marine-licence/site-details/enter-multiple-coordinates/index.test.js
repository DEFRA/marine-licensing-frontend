import { enterMultipleCoordinatesRoutes } from '#src/server/marine-licence/site-details/enter-multiple-coordinates/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('Enter Multiple Coordinates Routes (marine licence)', () => {
  test('should export an array of 2 routes', () => {
    expect(Array.isArray(enterMultipleCoordinatesRoutes)).toBe(true)
    expect(enterMultipleCoordinatesRoutes).toHaveLength(2)
  })

  test('should include GET route', () => {
    const getRoute = enterMultipleCoordinatesRoutes.find(
      (route) => route.method === 'GET'
    )

    expect(getRoute).toBeDefined()
    expect(getRoute.path).toBe(
      marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
    )
    expect(getRoute.handler).toBeDefined()
  })

  test('should include POST route', () => {
    const postRoute = enterMultipleCoordinatesRoutes.find(
      (route) => route.method === 'POST'
    )

    expect(postRoute).toBeDefined()
    expect(postRoute.path).toBe(
      marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
    )
    expect(postRoute.handler).toBeDefined()
  })

  test('all routes should use the correct path', () => {
    enterMultipleCoordinatesRoutes.forEach((route) => {
      expect(route.path).toBe(
        marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
      )
    })
  })
})
