import { addSeconds } from 'date-fns'

export const setUserSession = async (request) => {
  const { profile } = request.auth.credentials
  const sessionId = profile.sessionId || crypto.randomUUID()
  const expiresInSeconds = request.auth.credentials.expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  await request.server.app.cache.set(
    sessionId,
    {
      ...profile,
      sessionId,
      strategy: request.auth.strategy,
      isAuthenticated: request.auth.isAuthenticated,
      token: request.auth.credentials.token,
      refreshToken: request.auth.credentials.refreshToken,
      expiresIn: expiresInMilliSeconds,
      expiresAt: expiresAt.toISOString()
    },
    expiresInMilliSeconds
  )

  request.cookieAuth.set({ sessionId })
}
