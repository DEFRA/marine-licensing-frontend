import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  updateWaterFrameworkDirective,
  setWaterFrameworkDirectivePageEntryPoint,
  getWaterFrameworkDirectivePageEntryPoint
} from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import joi from 'joi'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'
import {
  getBackLink,
  getCancelLink
} from '#src/server/marine-licence/water-framework-directive/nautical-mile/utils.js'

export const NAUTICAL_MILE_VIEW_ROUTE =
  'marine-licence/water-framework-directive/nautical-mile/index'

const NAUTICAL_MILE_HEADING =
  'Is your project within one nautical mile (1.85km) of the low-water line, or in a tidal river or estuary?'

export const errorMessages = {
  NAUTICAL_MILE_REQUIRED:
    'Select whether your project is located within one nautical mile (1.85km) of the coast'
}

const nauticalMileSettings = {
  pageTitle: NAUTICAL_MILE_HEADING,
  heading: NAUTICAL_MILE_HEADING
}

export const nauticalMileController = {
  async handler(request, h) {
    const marineLicence = getMarineLicenceCache(request)
    const { waterFrameworkDirective } = marineLicence

    const returnTo = request.yar.get(RETURN_TO_CACHE_KEY)
    const { action } = request.query

    const isReturningFromWithinFlow = request.info?.referrer?.includes(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
    let waterFrameworkDirectiveEntryPoint =
      getWaterFrameworkDirectivePageEntryPoint(
        request,
        'waterFrameworkDirectiveEntryPoint'
      )

    if (!isReturningFromWithinFlow) {
      const hasExistingAnswer = Boolean(waterFrameworkDirective?.nauticalMile)
      waterFrameworkDirectiveEntryPoint = hasExistingAnswer
        ? 'task-list'
        : 'before-you-start'
      await setWaterFrameworkDirectivePageEntryPoint(
        request,
        h,
        'waterFrameworkDirectiveEntryPoint',
        waterFrameworkDirectiveEntryPoint
      )
    }

    return h.view(NAUTICAL_MILE_VIEW_ROUTE, {
      ...nauticalMileSettings,
      backLink: getBackLink(
        returnTo,
        action,
        waterFrameworkDirectiveEntryPoint
      ),
      cancelLink: getCancelLink(returnTo, action),
      projectName: marineLicence.projectName,
      payload: { nauticalMile: waterFrameworkDirective?.nauticalMile }
    })
  }
}

export const nauticalMileSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        nauticalMile: joi.string().valid('yes', 'no').required().messages({
          'any.only': errorMessages.NAUTICAL_MILE_REQUIRED,
          'string.empty': errorMessages.NAUTICAL_MILE_REQUIRED,
          'any.required': errorMessages.NAUTICAL_MILE_REQUIRED
        })
      }),
      failAction: (request, h, err) => {
        const { projectName } = getMarineLicenceCache(request)

        const returnTo = request.yar.get(RETURN_TO_CACHE_KEY)
        const { action } = request.query
        const waterFrameworkDirectiveEntryPoint =
          getWaterFrameworkDirectivePageEntryPoint(
            request,
            'waterFrameworkDirectiveEntryPoint'
          )

        return createFailAction({
          viewRoute: NAUTICAL_MILE_VIEW_ROUTE,
          settings: nauticalMileSettings,
          backLink: getBackLink(
            returnTo,
            action,
            waterFrameworkDirectiveEntryPoint
          ),
          errorMessages,
          projectName,
          payload: request.payload,
          params: { cancelLink: getCancelLink(returnTo, action) }
        })(request, h, err)
      }
    }
  },
  async handler(request, h) {
    const { payload } = request

    const { nauticalMile } = payload

    await updateWaterFrameworkDirective(
      request,
      h,
      'nauticalMile',
      nauticalMile
    )

    if (nauticalMile === 'no') {
      await saveWaterFrameworkDirectiveToBackend(request)
      const returnTo = request.yar.get(RETURN_TO_CACHE_KEY)
      if (returnTo) {
        return h.redirect(`${returnTo}#water-framework-directive-card`)
      }
      return h.redirect(marineLicenceRoutes.MARINE_LICENCE_TASK_LIST)
    }

    if (request.query.action) {
      return h.redirect(
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
      )
    }

    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  }
}
