import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { selectActivityVariants } from '#src/server/common/constants/activity-variants.js'

export const SELECT_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/select-activity/index'

export const selectActivityController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { activityVariant } = request.params
    const { heading } = selectActivityVariants[activityVariant]

    const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
      request.query
    )

    const backLink = marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY

    return h.view(SELECT_ACTIVITY_VIEW_ROUTE, {
      heading,
      pageTitle: heading,
      backLink,
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber
    })
  }
}

export const selectActivitySubmitController = {
  handler(request, h) {
    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
  }
}
