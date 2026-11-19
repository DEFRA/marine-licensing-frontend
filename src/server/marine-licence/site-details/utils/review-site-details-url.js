import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'

const FIRST_SITE_NUMBER = 1

export const getReviewSiteDetailsUrl = (siteNumber, action) => {
  if (siteNumber === FIRST_SITE_NUMBER && !action) {
    return marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
  }
  return `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
}
