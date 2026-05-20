import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getSiteDataFromParam,
  hasInvalidSiteNumber
} from '#src/server/common/helpers/site-details/site-name.js'

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

export const validateSiteRequiredParam = {
  method: (request, h) => {
    const { site } = request.query

    if (!site) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST).takeover()
    }

    return validateSiteParam.method(request, h)
  }
}

export const validateSiteParam = {
  method: (request, h) => {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber } = getSiteDataFromParam(request.query)

    if (hasInvalidSiteNumber(siteNumber, marineLicence.siteDetails ?? [])) {
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST).takeover()
    }

    return h.continue
  }
}
