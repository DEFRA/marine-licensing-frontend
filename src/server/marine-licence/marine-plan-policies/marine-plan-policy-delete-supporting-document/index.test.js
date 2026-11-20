import { marinePlanPolicyDeleteSupportingDocumentRoutes } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-delete-supporting-document/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

describe('marinePlanPolicyDeleteSupportingDocumentRoutes routes', () => {
  test('get route is formatted correctly', () => {
    expect(marinePlanPolicyDeleteSupportingDocumentRoutes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT
      })
    )
  })

  test('post route is formatted correctly', () => {
    expect(marinePlanPolicyDeleteSupportingDocumentRoutes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT
      })
    )
  })
})
