import { marinePlanPolicyDocumentsReviewRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicyDocumentsReviewRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(marinePlanPolicyDocumentsReviewRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
      })
    )
  })
})
