import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import joi from 'joi'

export const PREVIOUS_ASSESSMENT_VIEW_ROUTE =
  'marine-licence/water-framework-directive/previous-assessment/index'

const PREVIOUS_ASSESSMENT_HEADING =
  'Do you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity?'

export const errorMessages = {
  PREVIOUS_ASSESSMENT_REQUIRED:
    'Select whether you have a previous Water Framework Directive assessment completed between 2015 and 2022 for this type of activity'
}

const previousAssessmentSettings = {
  pageTitle: PREVIOUS_ASSESSMENT_HEADING,
  heading: PREVIOUS_ASSESSMENT_HEADING,
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const previousAssessmentController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective } = marineLicence

    return h.view(PREVIOUS_ASSESSMENT_VIEW_ROUTE, {
      ...previousAssessmentSettings,
      projectName: marineLicence.projectName,
      payload: {
        previousAssessment: waterFrameworkDirective?.previousAssessment
      }
    })
  }
}

export const previousAssessmentSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        previousAssessment: joi
          .string()
          .valid('yes', 'no')
          .required()
          .messages({
            'any.only': errorMessages.PREVIOUS_ASSESSMENT_REQUIRED,
            'string.empty': errorMessages.PREVIOUS_ASSESSMENT_REQUIRED,
            'any.required': errorMessages.PREVIOUS_ASSESSMENT_REQUIRED
          })
      }),
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: PREVIOUS_ASSESSMENT_VIEW_ROUTE,
          settings: previousAssessmentSettings,
          backLink: previousAssessmentSettings.backLink,
          errorMessages,
          projectName,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { previousAssessment } = payload

    await updateWaterFrameworkDirective(
      request,
      h,
      'previousAssessment',
      previousAssessment
    )

    if (previousAssessment === 'yes') {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_ASSESSMENT_CHANGED
      )
    }

    await updateWaterFrameworkDirective(request, h, 'assessmentChanged', null)

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  }
}
