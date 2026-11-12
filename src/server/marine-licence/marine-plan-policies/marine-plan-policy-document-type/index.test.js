import { marinePlanPolicyDocumentTypeRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicyDocumentTypeRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(marinePlanPolicyDocumentTypeRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(marinePlanPolicyDocumentTypeRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE
      })
    )
  })
})
