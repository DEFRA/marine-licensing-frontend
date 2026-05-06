import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getActivityDetailsBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
