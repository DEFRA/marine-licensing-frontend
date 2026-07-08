import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { marinePlanPoliciesController } from '#src/server/marine-licence/marine-plan-policies/controller.js'
import { marinePlanPolicyRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy/index.js'

export const marinePlanPoliciesRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
    ...marinePlanPoliciesController
  },
  ...marinePlanPolicyRoutes
]
