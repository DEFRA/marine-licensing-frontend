import Boom from '@hapi/boom'

import { config } from '#src/config/config.js'

export const PROJECT_NAME_VIEW_ROUTE = 'marine-license/project-name/index'

const projectNameViewSettings = {
  pageTitle: 'Project name',
  heading: 'Project Name'
}

export const projectNameController = {
  handler(_request, h) {
    const marineLicenseConfig = config.get('marineLicense')

    if (!marineLicenseConfig.enabled) {
      throw Boom.forbidden('Marine License journey is not enabled')
    }

    return h.view(PROJECT_NAME_VIEW_ROUTE, {
      ...projectNameViewSettings
    })
  }
}
