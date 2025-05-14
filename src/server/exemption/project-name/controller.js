import { config } from '~/src/config/config.js'
import {
  errorDescriptionByFieldName,
  mapErrorsForDisplay
} from '~/src/server/common/helpers/errors.js'
import {
  getExemptionCache,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'

import Wreck from '@hapi/wreck'
import joi from 'joi'

const errorMessages = {
  PROJECT_NAME_REQUIRED: 'Enter the project name',
  PROJECT_NAME_MAX_LENGTH: 'Project name should be 250 characters or less'
}

export const PROJECT_NAME_ROUTE = '/exemption/project-name'
export const PROJECT_NAME_VIEW_ROUTE = 'exemption/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const projectNameController = {
  handler(request, h) {
    const exemption = getExemptionCache(request)

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings,
      payload: { projectName: exemption.projectName }
    })
  }
}

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const projectNameSubmitController = {
  options: {
    validate: {
      payload: joi.object({
        projectName: joi.string().min(1).required().messages({
          'string.empty': 'PROJECT_NAME_REQUIRED'
        })
      }),
      failAction: (request, h, err) => {
        const { payload } = request

        if (!err.details) {
          return h
            .view(PROJECT_NAME_VIEW_ROUTE, {
              ...projectNameViewSettings,
              payload
            })
            .takeover()
        }

        const errorSummary = mapErrorsForDisplay(err.details, errorMessages)

        const errors = errorDescriptionByFieldName(errorSummary)

        return h
          .view(PROJECT_NAME_VIEW_ROUTE, {
            ...projectNameViewSettings,
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

      const isUpdate = !!exemption.id

      const { payload: responsePayload } = isUpdate
        ? await Wreck.patch(
            `${config.get('backend').apiUrl}/exemption/project-name`,
            {
              payload: { ...payload, id: exemption.id },
              json: true
            }
          )
        : await Wreck.post(
            `${config.get('backend').apiUrl}/exemption/project-name`,
            {
              payload,
              json: true
            }
          )

      setExemptionCache(request, {
        ...exemption,
        ...(!isUpdate && responsePayload.value),
        projectName: payload.projectName
      })

      return h.redirect('/exemption/task-list')
    } catch (e) {
      const { details } = e.data?.payload?.validation ?? {}

      if (!details) {
        throw e
      }

      const errorSummary = mapErrorsForDisplay(details, errorMessages)

      const errors = errorDescriptionByFieldName(errorSummary)

      return h.view(PROJECT_NAME_VIEW_ROUTE, {
        ...projectNameViewSettings,
        payload,
        errors,
        errorSummary
      })
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
