import { config } from '~/src/config/config.js'
import { mapErrorMessage } from '~/src/server/exemption/project-name/utils.js'
import { errorDescriptionByFieldName } from '~/src/server/common/helpers/errors.js'
import Wreck from '@hapi/wreck'

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
