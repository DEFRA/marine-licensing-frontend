import { marinePlanPolicySupportingDocumentRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicySupportingDocumentRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(marinePlanPolicySupportingDocumentRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(marinePlanPolicySupportingDocumentRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT
      })
    )
  })
})
