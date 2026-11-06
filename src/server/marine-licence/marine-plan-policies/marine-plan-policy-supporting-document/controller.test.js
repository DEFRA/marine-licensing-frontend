import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  marinePlanPolicySupportingDocumentController,
  marinePlanPolicySupportingDocumentSubmitController,
  MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/controller.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

describe('#marinePlanPolicySupportingDocumentController', () => {
  test('renders the page with the marine plan policies back and cancel links', () => {
    const h = createMockH()

    marinePlanPolicySupportingDocumentController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
      expect.objectContaining({
        pageTitle: 'Supporting documents',
        heading: 'Supporting documents',
        backLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      })
    )
  })
})

describe('#marinePlanPolicySupportingDocumentSubmitController', () => {
  test('redirects to the document type page on success', async () => {
    const h = createMockH()

    await marinePlanPolicySupportingDocumentSubmitController.handler({}, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE
    )
  })

  test('failAction re-renders the page and takes over the response', async () => {
    const h = createMockH()

    await marinePlanPolicySupportingDocumentSubmitController.options.validate.failAction(
      {},
      h,
      undefined
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Supporting documents',
        backLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      })
    )
    expect(h.view().takeover).toHaveBeenCalled()
  })
})
