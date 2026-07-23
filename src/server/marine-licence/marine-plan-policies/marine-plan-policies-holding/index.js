import { marinePlanPoliciesHoldingController } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policies-holding/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPoliciesHoldingRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING,
    ...marinePlanPoliciesHoldingController
  }
]
