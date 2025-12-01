import {
  getUserSession,
  removeUserSession,
  refreshAccessToken,
  updateUserSession
} from '#src/server/common/plugins/auth/utils.js'
import { isPast, parseISO, subMinutes } from 'date-fns'
import { isEntraIdRoute } from '#src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

const isAuthStrategyValidForRoute = (strategy, requestPath) => {
  if (strategy === AUTH_STRATEGIES.ENTRA_ID) {
    return isEntraIdRoute(requestPath)
  }
  if (strategy === AUTH_STRATEGIES.DEFRA_ID) {
    return !isEntraIdRoute(requestPath)
  }
  return false
}

export const validateUserSession = async (request, session) => {
  const authedUser = await getUserSession(request, session)

  if (!authedUser) {
    return { isValid: false }
  }

  const minutesBeforeExpiry = 5
  const tokenIsExpiring = isPast(
    subMinutes(parseISO(authedUser.expiresAt), minutesBeforeExpiry)
  )

  if (tokenIsExpiring) {
    try {
      const response = await refreshAccessToken(request, session)

      if (!response.ok) {
        removeUserSession(request, session)
        return { isValid: false }
      }

      const refreshAccessTokenJson = response.json
      const updatedSession = await updateUserSession(
        request,
        refreshAccessTokenJson
      )

      return {
        isValid: true,
        credentials: updatedSession
      }
    } catch (error) {
      request.logger.error(
        {
          error: {
            message: error?.message || String(error),
            stack_trace: error?.stack,
            type:
              error?.name || error?.constructor?.name || 'UnhandledRejection'
          }
        },
        'refresh rejection error'
      )

      removeUserSession(request, session)

      return { isValid: false }
    }
  }
  const userSession = await request.server.app.cache.get(session.sessionId)

  if (
    userSession &&
    isAuthStrategyValidForRoute(userSession.strategy, request.path)
  ) {
    return {
      isValid: true,
      credentials: userSession
    }
  }

  return { isValid: false }
}
