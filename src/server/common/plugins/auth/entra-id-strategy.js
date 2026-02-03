import { config } from '#src/config/config.js'
import { openIdProvider } from '#src/server/common/plugins/auth/open-id-provider.js'
import { routes } from '#src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'

export const createEntraIdStrategy = async (server) => {
  const entraIdConfig = config.get('entraId')
  const cookieConfig = config.get('session.cookie')

  const provider = await openIdProvider('entraId', entraIdConfig)
  server.auth.strategy(AUTH_STRATEGIES.ENTRA_ID, 'bell', {
    location: () =>
      `${entraIdConfig.redirectUrl}${routes.AUTH_ENTRA_ID_CALLBACK}`,
    provider,
    password: cookieConfig.password,
    clientId: entraIdConfig.clientId,
    clientSecret: entraIdConfig.clientSecret,
    isSecure: cookieConfig.secure
  })
}
