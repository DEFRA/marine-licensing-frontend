import { marinePlanPolicyGuidanceRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-guidance/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicyGuidanceRoutes', () => {
  test('route is registered correctly', () => {
    expect(marinePlanPolicyGuidanceRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_GUIDANCE
      })
    ])
  })
})
