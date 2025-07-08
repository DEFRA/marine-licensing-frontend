import { routes } from '~/src/server/common/constants/routes.js'

/**
 * @param {Partial<Request> | null} request
 */
export function buildNavigation(request) {
  return [
    {
      text: 'Projects home',
      href: routes.DASHBOARD,
      active: request?.path === routes.DASHBOARD
    }
  ]
}

/**
 * @import { Request } from '@hapi/hapi'
 */
