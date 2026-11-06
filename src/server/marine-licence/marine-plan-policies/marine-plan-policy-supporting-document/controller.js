import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { marinePlanPolicySupportingDocumentSchema } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/schema.js'

export const MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/index'

const PAGE_TITLE = 'Supporting documents'

const settings = {
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE
}

const buildView = () => ({
  ...settings,
  backLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
})

export const marinePlanPolicySupportingDocumentController = {
  handler(_request, h) {
    return h.view(
      MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
      buildView()
    )
  }
}

export const marinePlanPolicySupportingDocumentSubmitController = {
  options: {
    validate: {
      payload: marinePlanPolicySupportingDocumentSchema,
      failAction: (request, h) => {
        return h
          .view(MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE, buildView())
          .takeover()
      }
    }
  },
  async handler(_request, h) {
    return h.redirect(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE
    )
  }
}
