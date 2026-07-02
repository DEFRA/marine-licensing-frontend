import { marinePlanPoliciesGuidanceRoutes } from '#src/server/marine-licence/marine-plan-policies-guidance/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPoliciesGuidanceRoutes', () => {
  test('route is registered correctly', () => {
    expect(marinePlanPoliciesGuidanceRoutes).toEqual([
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES_GUIDANCE
      })
    ])
  })
})
