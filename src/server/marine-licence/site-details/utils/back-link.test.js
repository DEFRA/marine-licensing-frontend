import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

describe('getActivityDetailsBackLink', () => {
  test('returns the review site details route with the correct anchor', () => {
    expect(getActivityDetailsBackLink(1, 2)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-2`
    )
  })
})
