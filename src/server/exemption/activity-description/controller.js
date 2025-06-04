import { config } from '~/src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import Wreck from '@hapi/wreck'
import joi from 'joi'

export const ACTIVITY_DESCRIPTION_VIEW_ROUTE =
  'exemption/activity-description/index'

const ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH = 4000

export const errorMessages = {
  ACTIVITY_DESCRIPTION_REQUIRED: 'Enter the activity description',
  ACTIVITY_DESCRIPTION_MAX_LENGTH: `Activity description must be ${ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH} characters or less`
}

const templateValues = {
  pageTitle: 'Activity description',
  heading: 'Activity description',
  backLink: routes.TASK_LIST
}

/**
 * A GDS styled activity description page GET controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDescriptionController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
      ...templateValues,
      payload: { activityDescription: exemption.activityDescription }
    })
  }
}

/**
 * A GDS styled activity description PATCH page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const activityDescriptionSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        activityDescription: joi
          .string()
          .min(1)
          .max(ACTIVITY_DESCRIPTION_FIELD_MAX_LENGTH)
          .required()
          .messages({
            'string.empty': errorMessages.ACTIVITY_DESCRIPTION_REQUIRED,
            'string.max': errorMessages.ACTIVITY_DESCRIPTION_MAX_LENGTH
          })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        if (!err.details) {
          return h
            .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
              ...templateValues,
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)
        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
            ...templateValues,
            payload,
            errors,
            errorSummary
          })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    try {
      const exemption = getExemptionCache(request)
      const { payload: responsePayload } = await Wreck.patch(
        `${config.get('backend').apiUrl}/exemption/activity-description`,
        {
          payload: { ...payload, id: exemption.id },
          json: true
        }
      )

      setExemptionCache(request, {
        ...exemption,
        ...responsePayload.value,
        activityDescription: payload.activityDescription
      })
      return h.redirect(routes.TASK_LIST)
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}

      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)
      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(ACTIVITY_DESCRIPTION_VIEW_ROUTE, {
        ...templateValues,
        payload,
        errors,
        errorSummary
      })
    }
  }
}
