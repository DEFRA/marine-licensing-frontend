import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { clearExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
export const homeController = {
  handler(request, h) {
    const { accountManagementUrl } = config.get('defraId')

    const referer = request.headers.referer

    if (referer && accountManagementUrl?.indexOf(referer) >= 0) {
      return h.redirect(routes.DASHBOARD)
    }
    clearExemptionCache(request)
    return h.redirect('/exemption')
  }
}
