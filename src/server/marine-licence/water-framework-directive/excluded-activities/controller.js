import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
import joi from 'joi'

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
  heading: EXCLUDED_ACTIVITIES_HEADING,
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const excludedActivitiesController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective } = marineLicence

    return h.view(EXCLUDED_ACTIVITIES_VIEW_ROUTE, {
      ...excludedActivitiesSettings,
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
        return createFailAction({
          viewRoute: EXCLUDED_ACTIVITIES_VIEW_ROUTE,
          settings: excludedActivitiesSettings,
          backLink: excludedActivitiesSettings.backLink,
          errorMessages,
          projectName,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { excludedActivities } = payload

    await updateWaterFrameworkDirective(
      request,
      h,
      'excludedActivities',
      excludedActivities
    )

    if (payload.excludedActivities === 'no') {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT
      )
    }

    await saveWaterFrameworkDirectiveToBackend(request)

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  }
}
