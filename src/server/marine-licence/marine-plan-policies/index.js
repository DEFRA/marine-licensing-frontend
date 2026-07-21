import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { marinePlanPoliciesController } from '#src/server/marine-licence/marine-plan-policies/controller.js'
import { marinePlanPolicyRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy/index.js'
import { marinePlanPoliciesHoldingRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policies-holding/index.js'
import { calculateMarinePlanPoliciesAndWaitRoutes } from '#src/server/marine-licence/marine-plan-policies/calculate-marine-plan-policies-and-wait/index.js'

export const marinePlanPoliciesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
    ...marinePlanPoliciesController
  },
  ...marinePlanPolicyRoutes,
  ...marinePlanPoliciesHoldingRoutes,
  ...calculateMarinePlanPoliciesAndWaitRoutes
]
