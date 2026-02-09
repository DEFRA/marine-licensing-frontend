import { routes } from '#src/server/common/constants/routes.js'
import {
  preLoginCheckSetupEmployeeController,
  preLoginCheckSetupEmployeeSubmitController
} from '#src/server/defraid-pre-login/check-setup-employee/controller.js'
import {
  preLoginWhoIsExemptionForController,
  preLoginWhoIsExemptionForSubmitController
} from '#src/server/defraid-pre-login/who-is-the-exemption-for/controller.js'
import { preLoginRegisterNewOrgController } from '#src/server/defraid-pre-login/register-new-org/controller.js'
import { preLoginAddToOrgAccountController } from '#src/server/defraid-pre-login/add-to-org-account/controller.js'

export const preLogin = {
  plugin: {
    name: 'preLogin',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.preLogin.WHO_IS_EXEMPTION_FOR,
          options: { auth: false },
          ...preLoginWhoIsExemptionForController
        },
        {
          method: 'POST',
          path: routes.preLogin.WHO_IS_EXEMPTION_FOR,
          ...preLoginWhoIsExemptionForSubmitController
        },
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
        },
        {
          method: 'GET',
          path: routes.preLogin.REGISTER_NEW_ORG,
          options: { auth: false },
          ...preLoginRegisterNewOrgController
        },
        {
          method: 'GET',
          path: routes.preLogin.ADD_TO_ORG_ACCOUNT,
          options: { auth: false },
          ...preLoginAddToOrgAccountController
        }
      ])
    }
  }
}
