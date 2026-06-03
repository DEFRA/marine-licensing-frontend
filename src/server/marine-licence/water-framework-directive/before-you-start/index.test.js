import { waterFrameworkDirectiveBeforeYouStartRoutes } from '#src/server/marine-licence/water-framework-directive/before-you-start/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('#waterFrameworkDirectiveBeforeYouStartRoutes', () => {
  test('should export an array of routes', () => {
    expect(Array.isArray(waterFrameworkDirectiveBeforeYouStartRoutes)).toBe(
      true
    )
  })

  test('should have a GET route for the water framework directive before you start page', () => {
    const getRoute = waterFrameworkDirectiveBeforeYouStartRoutes.find(
      (route) => route.method === 'GET'
    )

    expect(getRoute).toBeDefined()
    expect(getRoute.path).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START
    )
  })
})
