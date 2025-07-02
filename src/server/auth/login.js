import { routes } from '~/src/server/common/constants/routes.js'

export const loginController = {
  method: 'GET',
  path: routes.LOGIN,
  options: {
    auth: {
      strategy: 'defra-id',
      mode: 'try'
    }
  },
  handler: (_request, h) => {
    return h.redirect(routes.PROJECT_NAME)
  }
}
