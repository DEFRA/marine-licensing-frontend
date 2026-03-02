import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'
import { postloginUserSession } from '#src/server/common/helpers/defraid-login/session-cache.js'

export const exemptionLandingController = {
  async handler(request, h) {
    if (request.query.ACTIVITY_TYPE) {
      cacheMcmsContextFromQueryParams(request)
    }

    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession) {
      return h.redirect(routes.SIGNIN)
    }

    postloginUserSession.clear(request)

    const { userRelationshipType } = userSession

    if (userRelationshipType === USER_TYPES.CITIZEN) {
      return h.redirect(routes.postLogin.CONFIRM_INDIVIDUAL)
    }

    if (userRelationshipType === USER_TYPES.EMPLOYEE) {
      return h.redirect(routes.postLogin.CONFIRM_EMPLOYEE)
    }

    if (userRelationshipType === USER_TYPES.AGENT) {
      return h.redirect(routes.postLogin.CONFIRM_AGENT)
    }

    return h.redirect(routes.PROJECT_NAME)
  }
}
