import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import {
  USER_ROLE_TYPES,
  USER_TYPES
} from '#src/server/common/constants/user-types.js'
import Boom from '@hapi/boom'

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

export const validateConsulteeUserSession = {
  method: async (request, h) => {
    const userSession = await getUserSession(
      request,
      request.state?.userSession
    )

    const sessionCheck = validateSessionExists(userSession, h)
    if (sessionCheck) {
      return sessionCheck
    }
    const { userRoleType } = userSession

    if (userRoleType !== USER_ROLE_TYPES.CONSULTEE) {
      return h.redirect(routes.SERVICE_HOME).takeover()
    }

    return h.continue
  }
}

export const redirectConsulteeToConsultations = {
  method: (request, h) => {
    if (request.auth?.credentials?.userRoleType === USER_ROLE_TYPES.CONSULTEE) {
      return h.redirect(routes.CONSULTATIONS).takeover()
    }

    return h.continue
  }
}

export const validateTeamAdminSession = {
  method: (request) => {
    if (request.auth?.credentials?.isTeamAdmin !== true) {
      throw Boom.forbidden('Unauthorized')
    }
    return null
  }
}
