import { routes } from '#src/server/common/constants/routes.js'
export const getBackLink = (exemption, siteDetails) => {
  if (
    siteDetails.coordinatesType === 'file' &&
    exemption.multipleSiteDetails.sameActivityDates === 'no'
  ) {
    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_DETAILS_ACTIVITY_DATES
}
