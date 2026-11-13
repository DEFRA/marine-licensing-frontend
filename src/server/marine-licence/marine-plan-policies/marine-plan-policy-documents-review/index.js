import { marinePlanPolicyDocumentsReviewController } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyDocumentsReviewRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW,
    ...marinePlanPolicyDocumentsReviewController
  }
]
