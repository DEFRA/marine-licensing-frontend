import {
  waterFrameworkReviewData,
  NAUTICAL_MILE_HEADING,
  EXCLUDED_ACTIVITIES_HEADING,
  PREVIOUS_ASSESSMENT_HEADING,
  ASSESSMENT_CHANGED_HEADING,
  FILE_UPLOAD_HEADING
} from '~/src/server/common/helpers/marine-licence/water-framework-directive/water-framework-review-data.js'
import { waterFrameworkDirective } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('waterFrameworkReviewData', () => {
  test('maps nauticalMile "yes" to correct heading and display value', () => {
    const result = waterFrameworkReviewData({ nauticalMile: 'yes' })

    expect(result.nauticalMile).toEqual({
      key: { text: NAUTICAL_MILE_HEADING },
      value: { text: 'Yes' }
    })
  })

  test('maps excludedActivities "no" to correct heading and display value', () => {
    const result = waterFrameworkReviewData({
      excludedActivities: waterFrameworkDirective.excludedActivities
    })

    expect(result.excludedActivities).toEqual({
      key: { text: EXCLUDED_ACTIVITIES_HEADING },
      value: { text: 'No' }
    })
  })

  test('maps uploadedFile to correct heading and filename as display value', () => {
    const result = waterFrameworkReviewData({
      uploadedFile: waterFrameworkDirective.uploadedFile
    })

    expect(result.uploadedFile).toEqual({
      key: { text: FILE_UPLOAD_HEADING },
      value: { text: 'test-upload-id' }
    })
  })

  test('excludes s3Location from output', () => {
    const result = waterFrameworkReviewData({
      s3Location: waterFrameworkDirective.s3Location
    })

    expect(result.s3Location).toBeUndefined()
  })

  test('maps all fields from full mock object and excludes s3Location', () => {
    const result = waterFrameworkReviewData(waterFrameworkDirective)

    expect(result.nauticalMile).toEqual({
      key: { text: NAUTICAL_MILE_HEADING },
      value: { text: 'Yes' }
    })
    expect(result.excludedActivities).toEqual({
      key: { text: EXCLUDED_ACTIVITIES_HEADING },
      value: { text: 'No' }
    })
    expect(result.uploadedFile).toEqual({
      key: { text: FILE_UPLOAD_HEADING },
      value: { text: 'test-upload-id' }
    })
    expect(result.s3Location).toBeUndefined()
  })

  test('returns undefined heading and value for unrecognised key and null value', () => {
    const result = waterFrameworkReviewData({ unknownKey: null })

    expect(result.unknownKey).toEqual({
      key: { text: undefined },
      value: { text: undefined }
    })
  })
})
