import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  marinePlanPolicyDocumentTypeController,
  marinePlanPolicyDocumentTypeSubmitController,
  MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/controller.js'
import { createMockH } from '#src/server/test-helpers/mocks/helpers.js'

describe('#marinePlanPolicyDocumentTypeController', () => {
  test('re-renders the page with the supporting document back link and marine plan policies cancel link', () => {
    const h = createMockH()

    marinePlanPolicyDocumentTypeController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE,
      expect.objectContaining({
        pageTitle: 'What type of document is this?',
        heading: 'What type of document is this?',
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      })
    )
    expect(h.view().takeover).toHaveBeenCalled()
  })
})

describe('#marinePlanPolicyDocumentTypeSubmitController', () => {
  test('re-renders the same page on success', async () => {
    const h = createMockH()

    await marinePlanPolicyDocumentTypeSubmitController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'What type of document is this?',
        backLink:
          marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_SUPPORTING_DOCUMENT,
        cancelLink: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
      })
    )
    expect(h.view().takeover).toHaveBeenCalled()
  })

  test('failAction re-renders the same page and takes over the response', async () => {
    const h = createMockH()

    await marinePlanPolicyDocumentTypeSubmitController.options.validate.failAction(
      {},
      h,
      undefined
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_PLAN_POLICY_DOCUMENT_TYPE_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'What type of document is this?'
      })
    )
    expect(h.view().takeover).toHaveBeenCalled()
  })
})
