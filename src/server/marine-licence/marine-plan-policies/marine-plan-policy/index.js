import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  marinePlanPolicyController,
  marinePlanPolicySubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy/controller.js'

export const marinePlanPolicyRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY,
    ...marinePlanPolicyController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY,
    ...marinePlanPolicySubmitController
  }
]
