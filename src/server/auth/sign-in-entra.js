import { routes } from '~/src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'

export const loginEntraController = {
  method: 'GET',
  path: routes.SIGNIN_ENTRA,
  options: {
    auth: AUTH_STRATEGIES.ENTRA_ID
  },
  handler: (_request, h) => {
    const redirect = _request.yar.flash('redirectPath')
    return h.redirect(redirect || '/')
  }
}
