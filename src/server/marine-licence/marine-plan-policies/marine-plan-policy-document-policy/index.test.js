import { marinePlanPolicyDocumentPolicyRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicyDocumentPolicyRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(marinePlanPolicyDocumentPolicyRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(marinePlanPolicyDocumentPolicyRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY
      })
    )
  })
})
