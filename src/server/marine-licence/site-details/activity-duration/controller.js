import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { activityDurationSchema } from '#src/server/marine-licence/site-details/activity-duration/schema.js'
import { mapDurationErrors } from '#src/server/marine-licence/site-details/activity-duration/utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getActivityDetailsBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

export const activityDurationErrorMessages = {
  DURATION_REQUIRED: 'Enter the maximum duration of the activity',
  YEARS_REQUIRED: 'Enter the number of years',
  MONTHS_REQUIRED: 'Enter the number of months',
  DURATION_BOTH_ZERO: 'Years and months cannot both be 0',
  YEARS_NOT_INTEGER: 'Number of years must be an integer',
  MONTHS_NOT_VALID: 'Number of months must be an integer between 0 and 11'
}

export const MARINE_LICENCE_DURATION_VIEW_ROUTE =
  'marine-licence/site-details/activity-duration/index'

export const activityDurationSettings = {
  pageTitle: 'What is the maximum duration of the activity?',
  heading: 'What is the maximum duration of the activity?'
}

export const activityDurationController = {
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

    return h.view(MARINE_LICENCE_DURATION_VIEW_ROUTE, {
      ...activityDurationSettings,
      backLink: getActivityDetailsBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: {
        'activity-duration-years': activityDetails.activityDuration?.years,
        'activity-duration-months': activityDetails.activityDuration?.months
      }
    })
  }
}

export const activityDurationSubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: activityDurationSchema,
      failAction: (request, h, err) => {
        err.details = mapDurationErrors(err?.details)

        const marineLicence = getMarineLicenceCache(request)

        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        return createFailAction({
          projectName: marineLicence.projectName,
          viewRoute: MARINE_LICENCE_DURATION_VIEW_ROUTE,
          settings: activityDurationSettings,
          errorMessages: activityDurationErrorMessages,
          backLink: getActivityDetailsBackLink(
            siteNumber,
            activityDetailsNumber
          ),
          params: { activityDetailsNumber, siteNumber },
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const {
      activityDetailsNumber,
      activityDetailsIndex,
      siteIndex,
      siteNumber
    } = getSiteDataFromParam(request.query)

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activityDuration: {
          years: payload['activity-duration-years'],
          months: payload['activity-duration-months']
        }
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
    )
  }
}
