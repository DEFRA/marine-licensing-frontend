import { marinePlanPoliciesHoldingRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policies-holding/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPoliciesHoldingRoutes', () => {
  test('route is registered correctly', () => {
    expect(marinePlanPoliciesHoldingRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_HOLDING
      })
    ])
  })
})
