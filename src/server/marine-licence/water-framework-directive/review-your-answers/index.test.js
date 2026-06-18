import { waterFrameworkDirectiveReviewYourAnswersRoutes } from '#src/server/marine-licence/water-framework-directive/review-your-answers/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('waterFrameworkDirectiveReviewYourAnswersRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(waterFrameworkDirectiveReviewYourAnswersRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(waterFrameworkDirectiveReviewYourAnswersRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      })
    )
  })
})
