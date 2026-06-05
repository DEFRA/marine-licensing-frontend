import { waterFrameworkDirectiveExcludedActivitiesRoutes } from '#src/server/marine-licence/water-framework-directive/excluded-activities/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkDirectiveExcludedActivitiesRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectiveExcludedActivitiesRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(waterFrameworkDirectiveExcludedActivitiesRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
      })
    )
  })
})
