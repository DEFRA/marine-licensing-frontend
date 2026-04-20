import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { selectActivityVariants } from '#src/server/common/constants/activity-variants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { getActivityOptions } from '#src/server/marine-licence/site-details/select-activity/utils.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { selectActivitySchema } from '#src/server/common/validation/select-activity/schema.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { selectActivityErrorMessages } from '#src/server/common/validation/select-activity/constants.js'

export const SELECT_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/select-activity/index'

const backLink = marineLicenceRoutes.MARINE_LICENCE_TYPE_OF_ACTIVITY

export const selectActivityController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { activityVariant } = request.params
    const { heading } = selectActivityVariants[activityVariant]

    const {
      activityDetailsIndex,
      activityDetailsNumber,
      siteNumber,
      siteIndex
    } = getSiteDataFromParam(request.query)

    const activityDetails = getActivityDetailsByIndex(
      marineLicence,
      siteIndex,
      activityDetailsIndex
    )

    const activityOptions = getActivityOptions(activityDetails.activityType)

    return h.view(SELECT_ACTIVITY_VIEW_ROUTE, {
      heading,
      pageTitle: heading,
      backLink,
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      activityOptions,
      payload: { activities: activityDetails.activities }
    })
  }
}

export const selectActivitySubmitController = {
  options: {
    validate: {
      payload: selectActivitySchema,

      failAction: (request, h, err) => {
        const marineLicence = getMarineLicenceCache(request)

        if (err.details[0].path.includes('activities')) {
          err.details[0].hrefOverride = 'activities-2'
        }

        const { activityVariant } = request.params
        const { heading } = selectActivityVariants[activityVariant]

        const {
          activityDetailsIndex,
          activityDetailsNumber,
          siteNumber,
          siteIndex
        } = getSiteDataFromParam(request.query)

        const activityDetails = getActivityDetailsByIndex(
          marineLicence,
          siteIndex,
          activityDetailsIndex
        )

        const activityOptions = getActivityOptions(activityDetails.activityType)

        return createFailAction({
          getCache: getMarineLicenceCache,
          viewRoute: SELECT_ACTIVITY_VIEW_ROUTE,
          params: {
            heading,
            pageTitle: heading,
            siteNumber,
            activityDetailsNumber,
            activityOptions
          },
          errorMessages: selectActivityErrorMessages(
            activityDetails.activityType
          ),
          getBackLink: () => backLink
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const { activityDetailsIndex, siteIndex } = getSiteDataFromParam(
      request.query
    )

    const userHasSelectedOther = !!payload.otherActivity

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activities: payload.activities,
        ...(userHasSelectedOther && { otherReason: payload.otherActivity })
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
  }
}
