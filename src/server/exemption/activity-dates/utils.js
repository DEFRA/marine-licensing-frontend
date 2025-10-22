import { routes } from '#src/server/common/constants/routes.js'
export const getNextRoute = (exemption, queryParams = '') => {
  const multipleSitesEnabled =
    exemption?.multipleSiteDetails?.multipleSitesEnabled

  const nextRoute = multipleSitesEnabled
    ? routes.SAME_ACTIVITY_DESCRIPTION
    : routes.ACTIVITY_DESCRIPTION

  return nextRoute + queryParams
}

export const getBackRoute = (
  { siteIndex, queryParams = '' },
  exemption = null
) => {
  if (siteIndex === 0) {
    const isMultipleSites = exemption?.multipleSiteDetails?.multipleSitesEnabled

    if (
      !isMultipleSites &&
      exemption?.siteDetails?.[0]?.coordinatesType === 'file'
    ) {
      return routes.FILE_UPLOAD
    }

    if (!isMultipleSites) {
      return routes.MULTIPLE_SITES_CHOICE
    }

    return routes.SAME_ACTIVITY_DATES
  }

  return routes.SITE_NAME + queryParams
}
