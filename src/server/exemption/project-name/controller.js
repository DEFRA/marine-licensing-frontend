import { config } from '~/src/config/config.js'
import { errorDescriptionByFieldName } from '~/src/server/exemption/project-name/utils.js'
import Wreck from '@hapi/wreck'

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const projectNameController = {
  handler(_request, h) {
    return h.view('exemption/project-name/index', {
      pageTitle: 'Project name',
      heading: 'Project Name'
    })
  }
}

const mapErrorMessage = (error) => {
  switch (error) {
    case 'PROJECT_NAME_REQUIRED':
      return 'Enter the project name'
    case 'PROJECT_NAME_MAX_LENGTH':
      return 'Project name should be 250 characters or fewer'
    default:
      return 'Enter the project name'
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

      return h.view('exemption/project-name/index', {
        pageTitle: 'Project name',
        heading: 'Project Name'
      })
    } catch (e) {
      const { details } = e.data.payload.validation ?? []

      const errors = details.map((error) => ({
        href: `#${error.field}`,
        text: mapErrorMessage(error.message),
        field: error.field
      }))

      const errorSummary = errorDescriptionByFieldName(errors)

      return h.view('exemption/project-name/index', {
        pageTitle: 'Project name',
        heading: 'Project Name',
        errors,
        errorSummary
      })
    }
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
