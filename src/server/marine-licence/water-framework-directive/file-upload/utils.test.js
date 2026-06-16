import { getBackLink } from '#src/server/marine-licence/water-framework-directive/file-upload/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('getBackLink', () => {
  test('returns assessment-changed link when previousAssessment is yes', () => {
    expect(getBackLink('yes')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
    )
  })

  test('returns previous-assessment link when previousAssessment is no', () => {
    expect(getBackLink('no')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
    )
  })

  test('returns assessment-changed link when previousAssessment is undefined', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
    )
  })
})
