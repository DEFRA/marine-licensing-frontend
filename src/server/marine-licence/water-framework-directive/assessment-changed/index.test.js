import { waterFrameworkDirectiveAssessmentChangedRoutes } from '#src/server/marine-licence/water-framework-directive/assessment-changed/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkDirectiveAssessmentChangedRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectiveAssessmentChangedRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(waterFrameworkDirectiveAssessmentChangedRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      })
    )
  })
})
