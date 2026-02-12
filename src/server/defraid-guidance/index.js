import { routes } from '#src/server/common/constants/routes.js'
import {
  defraIdGuidanceCheckSetupEmployeeController,
  defraIdGuidanceCheckSetupEmployeeSubmitController
} from '#src/server/defraid-guidance/check-setup-employee/controller.js'
import {
  defraIdGuidanceWhoIsExemptionForController,
  defraIdGuidanceWhoIsExemptionForSubmitController
} from '#src/server/defraid-guidance/who-is-the-exemption-for/controller.js'
import { defraIdGuidanceRegisterNewOrgController } from '#src/server/defraid-guidance/register-new-org/controller.js'
import { defraIdGuidanceAddToOrgAccountController } from '#src/server/defraid-guidance/add-to-org-account/controller.js'

export const defraIdGuidance = {
  plugin: {
    name: 'defraIdGuidance',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR,
          options: { auth: false },
          ...defraIdGuidanceWhoIsExemptionForController
        },
        {
          method: 'POST',
          path: routes.defraIdGuidance.WHO_IS_EXEMPTION_FOR,
          ...defraIdGuidanceWhoIsExemptionForSubmitController
        },
        {
          method: 'GET',
          path: routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE,
          options: {
            auth: false
          },
          ...defraIdGuidanceCheckSetupEmployeeController
        },
        {
          method: 'POST',
          path: routes.defraIdGuidance.CHECK_SETUP_EMPLOYEE,
          ...defraIdGuidanceCheckSetupEmployeeSubmitController
        },
        {
          method: 'GET',
          path: routes.defraIdGuidance.REGISTER_NEW_ORG,
          options: { auth: false },
          ...defraIdGuidanceRegisterNewOrgController
        },
        {
          method: 'GET',
          path: routes.defraIdGuidance.ADD_TO_ORG_ACCOUNT,
          options: { auth: false },
          ...defraIdGuidanceAddToOrgAccountController
        }
      ])
    }
  }
}
