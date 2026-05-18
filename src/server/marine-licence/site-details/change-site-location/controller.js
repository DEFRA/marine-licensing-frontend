import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  setSingleSiteMode
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteRequiredParam } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'

export const CHANGE_SITE_LOCATION_VIEW_ROUTE =
  'marine-licence/site-details/change-site-location/index'

const CHANGE_SITE_LOCATION_PAGE_TITLE = 'Change site location'

export const changeSiteLocationController = {
  options: {
    pre: [validateSiteRequiredParam]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteIndex } = getSiteDataFromParam(request.query)

    const site = getSiteDetailsBySite(marineLicence, siteIndex)

    return h.view(CHANGE_SITE_LOCATION_VIEW_ROUTE, {
      pageTitle: CHANGE_SITE_LOCATION_PAGE_TITLE,
      heading: CHANGE_SITE_LOCATION_PAGE_TITLE,
      siteNumber,
      siteIndex,
      siteName: site.siteName,
      projectName: marineLicence.projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })
  }
}

export const changeSiteLocationSubmitController = {
  async handler(request, h) {
    const siteIndex = Number.parseInt(request.payload.siteIndex, 10)
    await setSingleSiteMode(request, h, siteIndex)
    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
    )
  }
}
