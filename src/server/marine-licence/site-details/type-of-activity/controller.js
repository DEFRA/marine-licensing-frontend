import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getActivityDetailsByIndex } from '#src/server/common/helpers/marine-licence/session-cache/site-details-utils.js'
import { typeOfActivitySchema } from '#src/server/marine-licence/site-details/type-of-activity/schema.js'
import { getSiteDataFromParam } from '#src/server/common/helpers/site-details/site-name.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { getActivityVariantFromSubType } from '#src/server/common/helpers/activity-details/activity-variants.js'
import { validateSiteAndActivityParams } from '#src/server/common/helpers/marine-licence/session-cache/site-utils.js'
import { getActivityDetailsBackLink } from '#src/server/marine-licence/site-details/utils/back-link.js'

export const typeOfActivityErrorMessages = {
  ACTIVITY_TYPE_REQUIRED: 'Select the type of activity',
  ACTIVITY_TYPE_CONSTRUCTION_REQUIRED: 'Select the type of works',
  ACTIVITY_TYPE_DEPOSIT_REQUIRED: 'Select the type of deposit',
  ACTIVITY_TYPE_REMOVAL_REQUIRED: 'Select the type of removal'
}

export const MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/type-of-activity/index'

const subTypePayload = (activityType, activitySubType) => ({
  activitySubTypeConstruction:
    activityType === 'construction' ? activitySubType : '',
  activitySubTypeDeposit: activityType === 'deposit' ? activitySubType : '',
  activitySubTypeRemoval: activityType === 'removal' ? activitySubType : ''
})

export const typeOfActivitySettings = {
  pageTitle: 'Type of activity',
  heading: 'Type of activity'
}

export const typeOfActivityController = {
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

    return h.view(MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE, {
      ...typeOfActivitySettings,
      backLink: getActivityDetailsBackLink(siteNumber, activityDetailsNumber),
      projectName: marineLicence.projectName,
      siteNumber,
      activityDetailsNumber,
      payload: {
        activityType: activityDetails.activityType,
        ...subTypePayload(
          activityDetails.activityType,
          activityDetails.activitySubType
        )
      }
    })
  }
}

export const typeOfActivitySubmitController = {
  options: {
    pre: [validateSiteAndActivityParams],
    validate: {
      payload: typeOfActivitySchema,
      failAction: (request, h, err) => {
        const marineLicence = getMarineLicenceCache(request)

        const { activityDetailsNumber, siteNumber } = getSiteDataFromParam(
          request.query
        )
        return createFailAction({
          projectName: marineLicence.projectName,
          viewRoute: MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE,
          settings: typeOfActivitySettings,
          errorMessages: typeOfActivityErrorMessages,
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

    const activitySubTypeByType = {
      construction: payload.activitySubTypeConstruction,
      deposit: payload.activitySubTypeDeposit,
      removal: payload.activitySubTypeRemoval
    }

    const {
      activityDetailsNumber,
      activityDetailsIndex,
      siteIndex,
      siteNumber
    } = getSiteDataFromParam(request.query)

    const activitySubType = activitySubTypeByType[payload.activityType]

    const marineLicence = getMarineLicenceCache(request)
    const existingActivityDetails = getActivityDetailsByIndex(
      marineLicence,
      siteIndex,
      activityDetailsIndex
    )
    const activityTypeChanged =
      existingActivityDetails.activityType !== payload.activityType ||
      existingActivityDetails.activitySubType !== activitySubType

    await updateMarineLicenceSiteActivityDetails(
      request,
      h,
      siteIndex,
      activityDetailsIndex,
      {
        activityType: payload.activityType,
        activitySubType: activitySubTypeByType[payload.activityType],
        ...(activityTypeChanged && { activities: null })
      }
    )

    const getPageToNavigateTo = getActivityVariantFromSubType(activitySubType)

    return h.redirect(
      `/marine-licence/activity-details/${getPageToNavigateTo}?site=${siteNumber}&activity=${activityDetailsNumber}`
    )
  }
}
