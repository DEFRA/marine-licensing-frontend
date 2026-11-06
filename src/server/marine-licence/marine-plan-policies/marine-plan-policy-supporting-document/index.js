import {
  marinePlanPolicySupportingDocumentController,
  marinePlanPolicySupportingDocumentSubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicySupportingDocumentRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
    ...marinePlanPolicySupportingDocumentController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
    ...marinePlanPolicySupportingDocumentSubmitController
  }
]
