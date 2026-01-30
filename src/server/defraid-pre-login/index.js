import { routes } from '#src/server/common/constants/routes.js'
import {
  preLoginCheckSetupEmployeeController,
  preLoginCheckSetupEmployeeSubmitController
} from '#src/server/defraid-pre-login/check-setup-employee/controller.js'

export const preLogin = {
  plugin: {
    name: 'preLogin',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.preLogin.CHECK_SETUP_EMPLOYEE,
          options: {
            auth: false
          },
          ...preLoginCheckSetupEmployeeController
        },
        {
          method: 'POST',
          path: routes.preLogin.CHECK_SETUP_EMPLOYEE,
          ...preLoginCheckSetupEmployeeSubmitController
        }
      ])
    }
  }
}
