import {
  getUserSession,
  removeUserSession,
  refreshAccessToken,
  updateUserSession
} from '~/src/server/common/plugins/auth/utils.js'
import { isPast, parseISO, subMinutes } from 'date-fns'

export const validateUserSession = async (request, session) => {
  const userSession = await getUserSession(request, session)

  if (!userSession) {
    return { isValid: false }
  }

  const tokenHasExpired = isPast(subMinutes(parseISO(userSession.expiresAt), 1))

  if (tokenHasExpired) {
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
  }

  return { isValid: true, credentials: userSession }
}
