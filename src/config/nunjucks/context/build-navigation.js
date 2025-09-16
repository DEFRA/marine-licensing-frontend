import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'

/**
 * @param {Partial<Request> | null} request
 */
export const buildNavigation = async (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const authedUser = await getUserSession(request, request.state?.userSession)

  const navigation = [
    {
      text: 'Projects',
      href: routes.DASHBOARD,
      active: request?.path === routes.DASHBOARD
    }
  ]

  if (authedUser?.strategy === AUTH_STRATEGIES.DEFRA_ID) {
    navigation.push({
      text: 'Defra account',
      href: accountManagementUrl
    })
  }
  if (authedUser) {
    navigation.push({
      text: 'Sign out',
      href: routes.SIGN_OUT
    })
  }

  return navigation
}

/**
 * @import { Request } from '@hapi/hapi'
 */
