import { routes } from '~/src/server/common/constants/routes.js'
import { setUserSession } from './utils.js'
import { config } from '~/src/config/config.js'

export const signInOidcController = {
  method: ['GET', 'POST'],
  path: routes.AUTH_DEFRA_ID_CALLBACK,
  options: {
    auth: { strategy: 'defra-id', mode: 'try' }
  },
  handler: async (request, h) => {
    const { authEnabled } = config.get('defraId')

    if (authEnabled && request.auth?.isAuthenticated) {
      await setUserSession(request)
      request.logger.info('User has been successfully authenticated')
    }

    const redirect = request.yar.flash('referrer')?.at(0) ?? routes.PROJECT_NAME

    return h.redirect(redirect)
  }
}
