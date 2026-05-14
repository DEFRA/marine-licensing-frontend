import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'

export const CHANGE_SITE_LOCATION_VIEW_ROUTE =
  'marine-licence/site-details/change-site-location/index'

const CHANGE_SITE_LOCATION_PAGE_TITLE = 'Change site location'

export const changeSiteLocationController = {
  options: {
    pre: [validateSiteParams]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, siteIndex } = getSiteDataFromParam(request.query)

    return h.view(CHANGE_SITE_LOCATION_VIEW_ROUTE, {
      pageTitle: CHANGE_SITE_LOCATION_PAGE_TITLE,
      heading: CHANGE_SITE_LOCATION_PAGE_TITLE,
      siteNumber,
      siteIndex,
      projectName: marineLicence.projectName,
      backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
      cancelLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    })
  }
}

export const changeSiteLocationSubmitController = {
  handler(request, h) {
    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
    )
  }
}
