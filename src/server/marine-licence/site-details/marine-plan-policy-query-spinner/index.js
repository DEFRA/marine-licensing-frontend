import { marinePlanPolicyQuerySpinnerController } from './controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyQuerySpinnerRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES,
    ...marinePlanPolicyQuerySpinnerController
  }
]
