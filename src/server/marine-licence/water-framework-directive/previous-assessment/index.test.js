import { waterFrameworkDirectivePreviousAssessmentRoutes } from '#src/server/marine-licence/water-framework-directive/previous-assessment/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkDirectivePreviousAssessmentRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectivePreviousAssessmentRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(waterFrameworkDirectivePreviousAssessmentRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      })
    )
  })
})
