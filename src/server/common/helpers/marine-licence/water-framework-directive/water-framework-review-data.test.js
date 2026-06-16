import {
  waterFrameworkReviewData,
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING
} from '~/src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { waterFrameworkDirective } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('waterFrameworkReviewData', () => {
  test('maps data that is always present  to correct heading and display value', () => {
    const result = waterFrameworkReviewData({
      nauticalMile: waterFrameworkDirective.nauticalMile,
      excludedActivities: waterFrameworkDirective.excludedActivities
    })

    expect(result.nauticalMile).toEqual({
      key: { text: NAUTICAL_MILE_HEADING },
      value: { text: 'Yes' }
    })

    expect(result.excludedActivities).toEqual({
      key: { text: EXCLUDED_ACTIVITIES_HEADING },
      value: { text: 'No' }
    })
  })

  test('returns undefined heading and value for unrecognised key and null value', () => {
    const result = waterFrameworkReviewData({ unknownKey: null })

    expect(result.unknownKey).toEqual({
      key: { text: undefined },
      value: { text: undefined }
    })
  })
})
