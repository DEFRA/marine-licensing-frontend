import { routes } from '#src/server/common/constants/routes.js'
import {
  cacheMcmsContextFromQueryParams,
  getMcmsContextFromCache
} from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { clearExemptionCache } from '#src/server/common/helpers/session-cache/utils.js'
import { isUserReferredFromDefraAccount } from '#src/server/common/helpers/check-request-referrer.js'
export const homeController = {
  async handler(request, h) {
    if (isUserReferredFromDefraAccount(request)) {
      return h.redirect(routes.SERVICE_HOME)
    }

    // if the user is already logged in,
    // AND there's no MCMS context in cache (it would be in cache if they'd just come from sign in)
    // AND the URL does not have an IAT query string
    // then redirect to projects dashboard
    if (
      request.auth?.isAuthenticated &&
      !getMcmsContextFromCache(request) &&
      !request.query.ACTIVITY_TYPE
    ) {
      return h.redirect(routes.SERVICE_HOME)
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
