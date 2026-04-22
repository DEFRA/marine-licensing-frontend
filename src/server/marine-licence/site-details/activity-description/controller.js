import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { activityDescriptionSchema } from '#src/server/common/validation/activity-description/schema.js'
import {
  activityDescriptionSettings,
  activityDescriptionErrorMessages
} from '#src/server/common/validation/activity-description/constants.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'

export const MARINE_LICENCE_ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'marine-licence/site-details/activity-description/index'

const getBackLink = (siteNumber, activityDetailsNumber) =>
  `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`

export const activityDescriptionController = {
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

    return h.view(MARINE_LICENCE_ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...activityDescriptionSettings,
      backLink: getBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: {
        activityDescription: activityDetails.activityDescription
      }
    })
  }
}

export const activityDescriptionSubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: activityDescriptionSchema,
      failAction: (request, h, err) => {
        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        const marineLicence = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: MARINE_LICENCE_ACTIVITY_DESCRIPTION_VIEW_ROUTE,
          settings: activityDescriptionSettings,
          errorMessages: activityDescriptionErrorMessages,
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

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activityDescription: payload.activityDescription
      }
    )

    await saveSiteDetailsToBackend(request, h, { siteIndex })

    return h.redirect(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-${siteNumber}-activity-${activityDetailsNumber}`
    )
  }
}
