import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { workingHoursSchema } from '#src/server/common/validation/working-hours/schema.js'
import {
  workingHoursSettings,
  workingHoursErrorMessages
} from '#src/server/common/validation/working-hours/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getActivityDetailsBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

export const MARINE_LICENCE_WORKING_HOURS_VIEW_ROUTE =
  'marine-licence/site-details/working-hours/index'

export const workingHoursController = {
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

    return h.view(MARINE_LICENCE_WORKING_HOURS_VIEW_ROUTE, {
      ...workingHoursSettings,
      backLink: getActivityDetailsBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: {
        workingHours: activityDetails.workingHours
      }
    })
  }
}

export const workingHoursSubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: workingHoursSchema,
      failAction: (request, h, err) => {
        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        const marineLicence = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: MARINE_LICENCE_WORKING_HOURS_VIEW_ROUTE,
          settings: workingHoursSettings,
          errorMessages: workingHoursErrorMessages,
          projectName: marineLicence.projectName,
          backLink: getActivityDetailsBackLink(
            siteNumber,
            activityDetailsNumber
          ),
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

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        workingHours: payload.workingHours
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
    )
  }
}
