import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { activityDurationSchema } from '#src/server/marine-licence/site-details/activity-duration/schema.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'

export const activityDurationErrorMessages = {
  DURATION_REQUIRED: 'Enter the maximum duration of the activity'
}

export const MARINE_LICENCE_DURATION_VIEW_ROUTE =
  'marine-licence/site-details/activity-duration/index'

const getBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`

export const activityDurationSettings = {
  pageTitle: 'What is the maximum duration of the activity?',
  heading: 'What is the maximum duration of the activity?'
}

export const activityDurationController = {
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
      backLink: getBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: {
        'duration-years': activityDetails.durationYears,
        'duration-months': activityDetails.durationMonths
      }
    })
  }
}

export const activityDurationSubmitController = {
  options: {
    validate: {
      payload: activityDurationSchema,
      failAction: (request, h, err) => {
        const marineLicence = getMarineLicenceCache(request)

        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        return createFailAction({
          projectName: marineLicence.projectName,
          viewRoute: MARINE_LICENCE_DURATION_VIEW_ROUTE,
          settings: activityDurationSettings,
          errorMessages: activityDurationErrorMessages,
          backLink: getBackLink(siteNumber, activityDetailsNumber),
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
        durationYears: payload['duration-years'],
        durationMonths: payload['duration-months']
      }
    )

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}?site=${siteNumber}&activity=${activityDetailsNumber}`
    )
  }
}
