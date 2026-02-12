import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'

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

    if (userRelationshipType !== USER_TYPES.CITIZEN) {
      return h.redirect(routes.EXEMPTION).takeover()
    }

    return h.continue
  }
}
