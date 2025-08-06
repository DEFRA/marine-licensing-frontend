import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'

/**
 * @param {Partial<Request> | null} request
 */
export const buildNavigation = async (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const authedUser = await getUserSession(request, request.state?.userSession)

  const navigation = [
    {
      text: 'Projects home',
      href: routes.DASHBOARD,
      active: request?.path === routes.DASHBOARD
    }
  ]

  if (authedUser?.strategy === 'defra-id') {
    navigation.push({
      text: 'Defra account',
      href: accountManagementUrl
    })
  }

  return navigation
}

/**
 * @import { Request } from '@hapi/hapi'
 */
