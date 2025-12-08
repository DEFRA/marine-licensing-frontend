import { routes } from '#src/server/common/constants/routes.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
import {
  isUserReferredFromDefraAccount,
  isUserReferredFromSignIn
} from '#src/server/common/helpers/check-request-referrer.js'
export const homeController = {
  async handler(request, h) {
    if (isUserReferredFromDefraAccount(request)) {
      return h.redirect(routes.DASHBOARD)
    }

    // in case the user is already logged in and comes to / without an IAT query string
    if (!isUserReferredFromSignIn(request) && !request.query.ACTIVITY_TYPE) {
      return h.redirect(routes.DASHBOARD)
    }

    // redirect to start a new exemption
    await clearExemptionCache(request, h)
    // only cache IAT context if there's a querystring
    if (request.query.ACTIVITY_TYPE) {
      cacheMcmsContextFromQueryParams(request)
    }
    return h.redirect('/exemption')
  }
}
