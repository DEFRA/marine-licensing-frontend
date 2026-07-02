import { marinePlanPoliciesGuidanceController } from '#src/server/marine-licence/marine-plan-policies-guidance/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPoliciesGuidanceRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE,
    ...marinePlanPoliciesGuidanceController
  }
]
