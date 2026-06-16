import { getBackLink } from '#src/server/marine-licence/water-framework-directive/review-your-answers/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('getBackLink', () => {
  test('returns excluded-activities link when excludedActivities is yes', () => {
    expect(getBackLink('yes')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('returns file-upload link when excludedActivities is no', () => {
    expect(getBackLink('no')).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })

  test('returns file-upload link when excludedActivities is undefined', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  })
})
