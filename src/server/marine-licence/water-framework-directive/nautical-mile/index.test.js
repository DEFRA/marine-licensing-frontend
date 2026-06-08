import { waterFrameworkDirectiveNauticalMileRoutes } from '#src/server/marine-licence/water-framework-directive/nautical-mile/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkDirectiveNauticalMileRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectiveNauticalMileRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(waterFrameworkDirectiveNauticalMileRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
      })
    )
  })
})
