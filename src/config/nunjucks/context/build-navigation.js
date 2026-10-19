import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'

const getNavItem = (request, text, href) => ({
  text,
  href,
  active: request?.path === href
})

export const buildNavigation = (request) => {
  const { accountManagementUrl } = config.get('defraId')

  const authProvider = getAuthProvider(request)

  if (authProvider === AUTH_STRATEGIES.DEFRA_ID) {
    const isConsultee =
      request?.auth?.credentials?.userRelationshipType === USER_TYPES.CONSULTEE

    const primaryItems = isConsultee
      ? [getNavItem(request, 'Consultations', routes.CONSULTATIONS)]
      : [
          getNavItem(request, 'Home', routes.SERVICE_HOME),
          getNavItem(request, 'Submissions', routes.DASHBOARD)
        ]

    return [
      ...primaryItems,
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
