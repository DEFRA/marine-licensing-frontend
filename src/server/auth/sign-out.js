import { routes } from '#src/server/common/constants/routes.js'
import {
  getUserSession,
  removeUserSession
} from '#src/server/common/plugins/auth/utils.js'

import { config } from '#src/config/config.js'
import { clearExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

export const signOutController = {
  method: 'GET',
  path: routes.SIGN_OUT,
  handler: async (request, h) => {
    const userSession = await getUserSession(request, request.auth.credentials)

    if (!userSession) {
      return h.redirect(routes.PROJECT_NAME)
    }

    removeUserSession(request, request.auth.credentials)

    await clearExemptionCache(request, h)

    const referrer = `${config.get('defraId.redirectUrl')}${routes.PROJECT_NAME}`
    const { idToken } = userSession

    const logoutUrl = encodeURI(
      `${userSession.logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${referrer}`
    )

    return h.redirect(logoutUrl)
  }
}
