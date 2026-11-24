import {
  marinePlanPolicyUnlinkSupportingDocumentsController,
  marinePlanPolicyUnlinkSupportingDocumentsSubmitController
} from '#src/server/marine-licence/marine-plan-policy-unlink-supporting-documents/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const marinePlanPolicyUnlinkSupportingDocumentsRoutes = [
  {
    method: 'GET',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS,
    ...marinePlanPolicyUnlinkSupportingDocumentsController
  },
  {
    method: 'POST',
    path: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS,
    ...marinePlanPolicyUnlinkSupportingDocumentsSubmitController
  }
]
