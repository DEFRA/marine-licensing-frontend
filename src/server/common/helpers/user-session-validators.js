import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'

export const validateSessionExists = (userSession, h) => {
  if (!userSession?.displayName) {
    return h.redirect(routes.SIGNIN).takeover()
  }
  return null
}

export const validateIndividualUserSession = {
  method: async (request, h) => {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const sessionCheck = validateSessionExists(userSession, h)
    if (sessionCheck) {
      return sessionCheck
    }

    const { userRelationshipType } = userSession

    if (userRelationshipType !== USER_TYPES.CITIZEN) {
      return h.redirect(routes.EXEMPTION).takeover()
    }

    return h.continue
  }
}

export const validateEmployeeUserSession = {
  method: async (request, h) => {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const sessionCheck = validateSessionExists(userSession, h)
    if (sessionCheck) {
      return sessionCheck
    }

    const { userRelationshipType } = userSession

    if (userRelationshipType !== USER_TYPES.EMPLOYEE) {
      return h.redirect(routes.EXEMPTION).takeover()
    }

    return h.continue
  }
}

export const validateAgentUserSession = {
  method: async (request, h) => {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const sessionCheck = validateSessionExists(userSession, h)
    if (sessionCheck) {
      return sessionCheck
    }

    const { userRelationshipType } = userSession

    if (userRelationshipType !== USER_TYPES.AGENT) {
      return h.redirect(routes.EXEMPTION).takeover()
    }

    return h.continue
  }
}
