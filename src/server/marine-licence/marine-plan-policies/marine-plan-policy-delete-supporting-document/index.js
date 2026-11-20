import {
  marinePlanPolicyDeleteSupportingDocumentController,
  marinePlanPolicyDeleteSupportingDocumentSubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-delete-supporting-document/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyDeleteSupportingDocumentRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT,
    ...marinePlanPolicyDeleteSupportingDocumentController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT,
    ...marinePlanPolicyDeleteSupportingDocumentSubmitController
  }
]
