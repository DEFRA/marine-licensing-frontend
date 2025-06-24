import { routes as routePaths } from '~/src/server/common/constants/routes.js'
import { confirmationController } from './controller.js'

const routes = [
  {
    method: 'GET',
    path: routePaths.CONFIRMATION,
    handler: confirmationController.handler.bind(confirmationController),
    options: {
      description:
        'Display confirmation page after successful exemption submission'
    }
  }
]

export { routes }
