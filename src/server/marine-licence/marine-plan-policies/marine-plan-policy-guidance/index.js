import { marinePlanPolicyGuidanceController } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-guidance/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyGuidanceRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE,
    ...marinePlanPolicyGuidanceController
  }
]
