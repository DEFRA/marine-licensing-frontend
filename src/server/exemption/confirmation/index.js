import { confirmationController } from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/exemption/confirmation',
    handler: confirmationController.handler.bind(confirmationController),
    options: {
      description:
        'Display confirmation page after successful exemption submission'
    }
  }
]

export { routes }
