import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '#src/server/common/helpers/errors.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getSiteDetailsBySite } from '#src/server/common/helpers/exemptions/session-cache/site-details-utils.js'
import { typeOfActivitySchema } from '#src/server/marine-licence/site-details/type-of-activity/schema.js'

export const typeOfActivityErrorMessages = {
  ACTIVITY_TYPE_REQUIRED: 'Select the type of activity',
  ACTIVITY_TYPE_CONSTRUCTION_REQUIRED: 'Select the type of construction',
  ACTIVITY_TYPE_DEPOSIT_REQUIRED: 'Select the type of deposit',
  ACTIVITY_TYPE_REMOVAL_REQUIRED: 'Select the type of removal'
}

export const MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE =
  'marine-licence/site-details/type-of-activity/index'

const backLink = marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
const cancelLink = marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS

const subTypePayload = (activityType, activitySubType) => ({
  activitySubTypeConstruction:
    activityType === 'construction' ? (activitySubType ?? '') : '',
  activitySubTypeDeposit:
    activityType === 'deposit' ? (activitySubType ?? '') : '',
  activitySubTypeRemoval:
    activityType === 'removal' ? (activitySubType ?? '') : ''
})

export const typeOfActivitySettings = {
  pageTitle: 'Type of activity',
  heading: 'Type of activity'
}

export const typeOfActivityController = {
  handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const site = getSiteDetailsBySite(marineLicence)

    return h.view(MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE, {
      ...typeOfActivitySettings,
      backLink,
      cancelLink,
      projectName: marineLicence.projectName,
      payload: {
        activityType: site.activityType,
        ...subTypePayload(site.activityType, site.activitySubType)
      }
    })
  }
}

export const typeOfActivitySubmitController = {
  options: {
    validate: {
      payload: typeOfActivitySchema,
      failAction: (request, h, err) => {
        const { payload } = request
        const { projectName } = getMarineLicenceCache(request)

        if (!err.details) {
          return h
            .view(MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE, {
              ...typeOfActivitySettings,
              backLink,
              cancelLink,
              payload,
              projectName
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(
          err.details,
          typeOfActivityErrorMessages
        )
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE, {
            ...typeOfActivitySettings,
            backLink,
            cancelLink,
            payload,
            projectName,
            errors,
            errorSummary
          })
          .takeover()
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

    await updateMarineLicenceSiteDetails(
      request,
      h,
      0,
      'activityType',
      payload.activityType
    )
    await updateMarineLicenceSiteDetails(
      request,
      h,
      0,
      'activitySubType',
      activitySubTypeByType[payload.activityType]
    )

    return h
      .redirect(marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS)
      .takeover()
  }
}
