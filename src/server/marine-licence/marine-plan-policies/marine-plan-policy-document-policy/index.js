import {
  marinePlanPolicyDocumentPolicyController,
  marinePlanPolicyDocumentPolicySubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyDocumentPolicyRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY,
    ...marinePlanPolicyDocumentPolicyController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY,
    ...marinePlanPolicyDocumentPolicySubmitController
  }
]
