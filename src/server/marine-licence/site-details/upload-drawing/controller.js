import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getActivityDetailsBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

export const UPLOAD_DRAWING_VIEW_ROUTE =
  'marine-licence/site-details/upload-drawing/index'

const UPLOAD_DRAWING_PAGE_TITLE = 'Upload a construction drawing'

export const uploadDrawingController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { siteNumber, activityDetailsNumber } = getSiteDataFromParam(
      request.query
    )

    return h.view(UPLOAD_DRAWING_VIEW_ROUTE, {
      pageTitle: UPLOAD_DRAWING_PAGE_TITLE,
      heading: UPLOAD_DRAWING_PAGE_TITLE,
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      backLink: getActivityDetailsBackLink(siteNumber, activityDetailsNumber)
    })
  }
}
