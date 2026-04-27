import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const validateSiteAndActivityParams = {
  method: (request, h) => {
    const { site, activity } = request.query

    if (!site || !activity) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST).takeover()
    }

    const siteIndex = Number.parseInt(site, 10) - 1
    const activityIndex = Number.parseInt(activity, 10) - 1

    const marineLicence = getMarineLicenceCache(request)
    const siteDetails = marineLicence.siteDetails?.[siteIndex]

    if (!siteDetails?.activityDetails?.[activityIndex]) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST).takeover()
    }

    return h.continue
  }
}

export const setSiteData = (request) => {
  const marineLicence = getMarineLicenceCache(request)
  return {
    siteIndex: 0,
    siteDetails: getSiteDetailsBySite(marineLicence)
  }
}

export const setSiteDataPreHandler = {
  method: (request, h) => {
    request.site = setSiteData(request)
    return h.continue
  }
}
