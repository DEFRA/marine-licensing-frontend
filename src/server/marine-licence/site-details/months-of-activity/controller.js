import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { monthsOfActivitySchema } from '#src/server/marine-licence/site-details/months-of-activity/schema.js'
import {
  monthsOfActivitySettings,
  monthsOfActivityErrorMessages
} from '#src/server/marine-licence/site-details/months-of-activity/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'

export const MARINE_LICENCE_MONTHS_OF_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/months-of-activity/index'

const getBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`

export const monthsOfActivityController = {
  options: {
    pre: [validateSiteAndActivityParams]
  },
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const {
      activityDetailsIndex,
      activityDetailsNumber,
      siteIndex,
      siteNumber
    } = getSiteDataFromParam(request.query)

    const activityDetails = getActivityDetailsByIndex(
      marineLicence,
      siteIndex,
      activityDetailsIndex
    )

    return h.view(MARINE_LICENCE_MONTHS_OF_ACTIVITY_VIEW_ROUTE, {
      ...monthsOfActivitySettings,
      backLink: getBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: activityDetails.activityMonths
    })
  }
}

export const monthsOfActivitySubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: monthsOfActivitySchema,
      failAction: (request, h, err) => {
        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        const marineLicence = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: MARINE_LICENCE_MONTHS_OF_ACTIVITY_VIEW_ROUTE,
          settings: monthsOfActivitySettings,
          errorMessages: monthsOfActivityErrorMessages,
          projectName: marineLicence.projectName,
          backLink: getBackLink(siteNumber, activityDetailsNumber),
          payload: request.payload,
          params: { activityDetailsNumber, siteNumber }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const {
      activityDetailsIndex,
      activityDetailsNumber,
      siteIndex,
      siteNumber
    } = getSiteDataFromParam(request.query)

    const hasMonthsOfActivity = payload.months === 'yes'

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activityMonths: {
          months: payload.months,
          ...(hasMonthsOfActivity && { details: payload.details })
        }
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
    )
  }
}
