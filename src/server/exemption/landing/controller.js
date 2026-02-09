import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

export const exemptionLandingController = {
  async handler(request, h) {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )
    if (!userSession) {
      return h.redirect(routes.SIGNIN)
    }
    const { userRelationshipType } = userSession
    if (userRelationshipType === 'Citizen') {
      return h.redirect(routes.postLogin.CONFIRM_INDIVIDUAL)
    }
    return h.redirect(routes.PROJECT_NAME)
  }
}
