import { config } from '~/src/config/config.js'
import { mapErrorMessage } from '~/src/server/exemption/project-name/utils.js'
import { errorDescriptionByFieldName } from '~/src/server/common/helpers/errors.js'
import Wreck from '@hapi/wreck'
import joi from 'joi'

const projectNameViewRoute = 'exemption/project-name/index'
const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const projectNameController = {
  handler(_request, h) {
    return h.view(projectNameViewRoute, {
      ...projectNameViewSettings
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
          return h.view(projectNameViewRoute, { ...projectNameViewSettings, payload }).takeover()
        }

        const errors = err.details.map((error) => ({
          href: `#${error.path}`,
          text: mapErrorMessage(error.message),
          field: error.path
        }))

        const errorSummary = errorDescriptionByFieldName(errors)

        return h
          .view(projectNameViewRoute, { ...projectNameViewSettings, payload, errors, errorSummary })
          .takeover()
      }
    }
  },
  async handler(request, h) {
    const { payload } = request
    try {
      await Wreck.post(
        `${config.get('backend').apiUrl}/exemption/project-name`,
        {
          payload,
          json: true
        }
      )

      return h.view(projectNameViewRoute, {
        ...projectNameViewSettings
      })
    } catch (e) {
      const { details } = e.data.payload.validation

      const errors = details.map((error) => ({
        href: `#${error.field}`,
        text: mapErrorMessage(error.message),
        field: error.field
      }))

      const errorSummary = errorDescriptionByFieldName(errors)

      return h.view(projectNameViewRoute, {
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
