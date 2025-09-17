import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { getAuthProvider } from '~/src/server/common/helpers/authenticated-requests.js'

/**
 * @param {Partial<Request> | null} request
 */
export const buildNavigation = (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const authProvider = getAuthProvider(request)

  if (authProvider === AUTH_STRATEGIES.DEFRA_ID) {
    return [
      {
        text: 'Projects',
        href: routes.DASHBOARD,
        active: request?.path === routes.DASHBOARD
      },
      {
        text: 'Defra account',
        href: accountManagementUrl
      },
      {
        text: 'Sign out',
        href: routes.SIGN_OUT
      }
    ]
  }

  return []
}

/**
 * @import { Request } from '@hapi/hapi'
 */
