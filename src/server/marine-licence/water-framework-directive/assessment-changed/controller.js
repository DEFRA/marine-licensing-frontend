import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import joi from 'joi'

export const ASSESSMENT_CHANGED_VIEW_ROUTE =
  'marine-licence/water-framework-directive/assessment-changed/index'

const ASSESSMENT_CHANGED_HEADING =
  'Has anything changed since your previous Water Framework Directive assessment?'

export const errorMessages = {
  ASSESSMENT_CHANGED_REQUIRED:
    'Select whether anything has changed since your previous Water Framework Directive assessment'
}

const assessmentChangedSettings = {
  pageTitle: ASSESSMENT_CHANGED_HEADING,
  heading: ASSESSMENT_CHANGED_HEADING,
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_PREVIOUS_ASSESSMENT,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const assessmentChangedController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective } = marineLicence

    return h.view(ASSESSMENT_CHANGED_VIEW_ROUTE, {
      ...assessmentChangedSettings,
      projectName: marineLicence.projectName,
      payload: {
        assessmentChanged: waterFrameworkDirective?.assessmentChanged
      }
    })
  }
}

export const assessmentChangedSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        assessmentChanged: joi.string().valid('yes', 'no').required().messages({
          'any.only': errorMessages.ASSESSMENT_CHANGED_REQUIRED,
          'string.empty': errorMessages.ASSESSMENT_CHANGED_REQUIRED,
          'any.required': errorMessages.ASSESSMENT_CHANGED_REQUIRED
        })
      }),
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: ASSESSMENT_CHANGED_VIEW_ROUTE,
          settings: assessmentChangedSettings,
          backLink: assessmentChangedSettings.backLink,
          errorMessages,
          projectName,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    const { assessmentChanged } = payload

    await updateWaterFrameworkDirective(
      request,
      h,
      'assessmentChanged',
      assessmentChanged
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD
    )
  }
}
