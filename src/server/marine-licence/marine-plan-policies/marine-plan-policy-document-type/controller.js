import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { marinePlanPolicyDocumentTypeSchema } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/schema.js'

export const MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE =
  'marine-licence/marine-plan-policies/marine-plan-policy-document-type/index'

const PAGE_TITLE = 'What type of document is this?'

const settings = {
  pageTitle: PAGE_TITLE,
  heading: PAGE_TITLE
}

const buildView = () => ({
  ...settings,
  backLink:
    marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
  cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
})

export const marinePlanPolicyDocumentTypeController = {
  handler(_request, h) {
    return h
      .view(MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE, buildView())
      .takeover()
  }
}

export const marinePlanPolicyDocumentTypeSubmitController = {
  options: {
    validate: {
      payload: marinePlanPolicyDocumentTypeSchema,
      failAction: (request, h) => {
        return h
          .view(MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE, buildView())
          .takeover()
      }
    }
  },
  async handler(_request, h) {
    return h
      .view(MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE, buildView())
      .takeover()
  }
}
