import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

const validateSessionExists = (userSession, h) => {
  if (!userSession?.displayName) {
    return h.redirect(routes.SIGNIN).takeover()
  }
}

export const validateIndividualUserSession = {
  method: async (request, h) => {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    if (!userSession?.displayName) {
      return validateSessionExists(userSession, h)
    }

    const { userRelationshipType } = userSession

    if (userRelationshipType !== 'Citizen') {
      return h.redirect(routes.EXEMPTION).takeover()
    }

    return h.continue
  }
}
