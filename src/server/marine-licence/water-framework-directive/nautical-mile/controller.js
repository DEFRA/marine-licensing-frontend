import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { updateWaterFrameworkDirective } from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import joi from 'joi'

export const NAUTICAL_MILE_VIEW_ROUTE =
  'marine-licence/water-framework-directive/nautical-mile/index'

export const errorMessages = {
  NAUTICAL_MILE_AGREE:
    'Select whether your project is located within one nautical mile (1.85km) of the coast'
}

const nauticalMileSettings = {
  pageTitle:
    'Is your project located within one nautical mile (1.85km) of the coast?',
  heading:
    'Is your project located within one nautical mile (1.85km) of the coast?',
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_BEFORE_YOU_START,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const nauticalMileController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const wfd = marineLicence.waterFrameworkDirective || {}

    return h.view(NAUTICAL_MILE_VIEW_ROUTE, {
      ...nauticalMileSettings,
      projectName: marineLicence.projectName,
      payload: { nauticalMile: wfd.nauticalMile }
    })
  }
}

export const nauticalMileSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        nauticalMile: joi.string().valid('yes', 'no').required().messages({
          'any.only': errorMessages.NAUTICAL_MILE_AGREE,
          'string.empty': errorMessages.NAUTICAL_MILE_AGREE,
          'any.required': errorMessages.NAUTICAL_MILE_AGREE
        })
      }),
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)
        return createFailAction({
          viewRoute: NAUTICAL_MILE_VIEW_ROUTE,
          settings: nauticalMileSettings,
          backLink: nauticalMileSettings.backLink,
          errorMessages,
          projectName,
          payload: request.payload
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    await updateWaterFrameworkDirective(
      request,
      h,
      'nauticalMile',
      payload.nauticalMile
    )

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
    )
  }
}
