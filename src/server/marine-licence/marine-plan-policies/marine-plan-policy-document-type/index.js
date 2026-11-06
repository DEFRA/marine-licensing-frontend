import {
  marinePlanPolicyDocumentTypeController,
  marinePlanPolicyDocumentTypeSubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyDocumentTypeRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE,
    ...marinePlanPolicyDocumentTypeController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE,
    ...marinePlanPolicyDocumentTypeSubmitController
  }
]
