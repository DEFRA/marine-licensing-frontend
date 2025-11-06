import { getSiteDetailsBySite } from '#src/server/common/helpers/session-cache/site-details-utils.js'
import { getExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
import { getSiteNumber } from '#src/server/exemption/site-details/utils/site-number.js'
import { routes } from '#src/server/common/constants/routes.js'

export const setSiteData = (request) => {
  const exemption = getExemptionCache(request)

  const siteNumber = getSiteNumber(exemption, request)

  const siteIndex = siteNumber && siteNumber - 1

  return {
    queryParams: siteNumber === 1 ? '' : `?site=${siteNumber}`,
    siteNumber,
    siteIndex,
    siteDetails: getSiteDetailsBySite(exemption, siteIndex)
  }
}

export const setSiteDataPreHandler = {
  method: (request, h) => {
    request.site = setSiteData(request)

    if (!request.site?.siteNumber) {
      return h.redirect(routes.TASK_LIST).takeover()
    }

    return h.continue
  }
}
