import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { completionDateSchema } from '#src/server/marine-licence/site-details/completion-date/schema.js'
import {
  completionDateSettings,
  completionDateErrorMessages
} from '#src/server/marine-licence/site-details/completion-date/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'

export const MARINE_LICENCE_COMPLETION_DATE_VIEW_ROUTE =
  'marine-licence/site-details/completion-date/index'

const getBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`

export const completionDateController = {
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

    return h.view(MARINE_LICENCE_COMPLETION_DATE_VIEW_ROUTE, {
      ...completionDateSettings,
      backLink: getBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: activityDetails.completionDate
    })
  }
}

export const completionDateSubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: completionDateSchema,
      failAction: (request, h, err) => {
        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        const marineLicence = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: MARINE_LICENCE_COMPLETION_DATE_VIEW_ROUTE,
          settings: completionDateSettings,
          errorMessages: completionDateErrorMessages,
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

    const hasCompletionDate = payload.date === 'yes'

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        completionDate: {
          date: payload.date,
          ...(hasCompletionDate && { reason: payload.reason })
        }
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
    )
  }
}
