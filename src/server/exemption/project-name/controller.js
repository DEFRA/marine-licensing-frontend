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

/**
 * A GDS styled project name page controller.
 * @satisfies {Partial<ServerRoute>}
 */
export const projectNameSubmitController = {
  handler(request, h) {
    return h.view('exemption/project-name/index', {
      pageTitle: 'Project name',
      heading: 'Project Name'
    })
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
