import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
import joi from 'joi'
import {
  setWaterFrameworkDirectiveReturnToCache,
  getWaterFrameworkDirectiveReturnRoute,
  clearWaterFrameworkDirectiveReturnToCache,
  updateWaterFrameworkDirective
} from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import {
  getBackLink,
  getCancelLink,
  getSubmitRedirect
} from '#src/server/marine-licence/water-framework-directive/excluded-activities/utils.js'

export const EXCLUDED_ACTIVITIES_VIEW_ROUTE =
  'marine-licence/water-framework-directive/excluded-activities/index'

const EXCLUDED_ACTIVITIES_HEADING =
  'Is your project limited to one of the following excluded activities?'

export const errorMessages = {
  EXCLUDED_ACTIVITIES_REQUIRED:
    'Select whether your project is limited to one of the excluded activities'
}

const excludedActivitiesSettings = {
  pageTitle: EXCLUDED_ACTIVITIES_HEADING,
  heading: EXCLUDED_ACTIVITIES_HEADING
}

export const excludedActivitiesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective } = marineLicence

    if (request.query.action) {
      await setWaterFrameworkDirectiveReturnToCache(
        request,
        h,
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )
    }

    const waterFrameworkDirectiveReturnTo =
      getWaterFrameworkDirectiveReturnRoute(request)

    return h.view(EXCLUDED_ACTIVITIES_VIEW_ROUTE, {
      ...excludedActivitiesSettings,
      backLink: getBackLink(waterFrameworkDirectiveReturnTo),
      cancelLink: getCancelLink(waterFrameworkDirectiveReturnTo),
      projectName: marineLicence.projectName,
      payload: {
        excludedActivities: waterFrameworkDirective?.excludedActivities
      }
    })
  }
}

export const excludedActivitiesSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        excludedActivities: joi
          .string()
          .valid('yes', 'no')
          .required()
          .messages({
            'any.only': errorMessages.EXCLUDED_ACTIVITIES_REQUIRED,
            'string.empty': errorMessages.EXCLUDED_ACTIVITIES_REQUIRED,
            'any.required': errorMessages.EXCLUDED_ACTIVITIES_REQUIRED
          })
      }),
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        const waterFrameworkDirectiveReturnTo =
          getWaterFrameworkDirectiveReturnRoute(request)
        return createFailAction({
          viewRoute: EXCLUDED_ACTIVITIES_VIEW_ROUTE,
          settings: excludedActivitiesSettings,
          backLink: getBackLink(waterFrameworkDirectiveReturnTo),
          errorMessages,
          projectName,
          payload: request.payload,
          params: { cancelLink: getCancelLink(waterFrameworkDirectiveReturnTo) }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { excludedActivities } = payload

    const marineLicence = getMarineLicenceCache(request)
    const previousExcludedActivities =
      marineLicence.waterFrameworkDirective?.excludedActivities

    await updateWaterFrameworkDirective(
      request,
      h,
      'excludedActivities',
      excludedActivities
    )

    const waterFrameworkDirectiveReturnTo =
      getWaterFrameworkDirectiveReturnRoute(request)

    const redirectPath = getSubmitRedirect(
      excludedActivities,
      waterFrameworkDirectiveReturnTo,
      previousExcludedActivities
    )

    if (excludedActivities === 'yes') {
      await saveWaterFrameworkDirectiveToBackend(request)
      clearWaterFrameworkDirectiveReturnToCache(request)
    }

    return h.redirect(redirectPath)
  }
}
