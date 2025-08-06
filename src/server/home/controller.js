import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 * @satisfies {Partial<ServerRoute>}
 */
export const homeController = {
  handler(request, h) {
    const { accountManagementUrl } = config.get('defraId')

    const referer = request.headers.referer

    if (referer && accountManagementUrl?.indexOf(referer) >= 0) {
      return h.redirect(routes.DASHBOARD)
    }

    return h.redirect('/exemption')
  }
}

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
