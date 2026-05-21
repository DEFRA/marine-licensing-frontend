import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDetailsAnchor } from '#src/server/common/helpers/site-details/anchor-utils.js'

export const getActivityDetailsBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`

export const getCoordinateSystemBackLink = (
  action,
  siteNumber,
  savedSiteDetails
) => {
  if (action) {
    if (savedSiteDetails.originalCoordinateSystem) {
      return `${marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE}?site=${siteNumber}&action=${action}`
    }
    return `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}${getSiteDetailsAnchor(siteNumber)}`
  }
  return marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
}
