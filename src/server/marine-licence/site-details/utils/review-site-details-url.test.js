import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getReviewSiteDetailsUrl } from '#src/server/marine-licence/site-details/utils/review-site-details-url.js'

describe('getReviewSiteDetailsUrl', () => {
  test('returns the review page without an anchor when adding the first site', () => {
    expect(getReviewSiteDetailsUrl(1)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  test('anchors to the site when adding a subsequent site', () => {
    expect(getReviewSiteDetailsUrl(2)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-2`
    )
  })

  test('anchors to the site when changing the first site', () => {
    expect(getReviewSiteDetailsUrl(1, 'change')).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
    )
  })
})
