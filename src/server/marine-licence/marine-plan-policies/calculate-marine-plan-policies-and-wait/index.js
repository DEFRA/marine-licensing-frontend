import { calculateMarinePlanPoliciesAndWaitController } from './controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const calculateMarinePlanPoliciesAndWaitRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES,
    ...calculateMarinePlanPoliciesAndWaitController
  }
]
