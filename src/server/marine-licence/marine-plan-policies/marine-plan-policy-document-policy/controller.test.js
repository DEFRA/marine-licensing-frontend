import { vi } from 'vitest'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import {
  marinePlanPolicyDocumentPolicyController,
  marinePlanPolicyDocumentPolicySubmitController
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/controller.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('#src/services/marine-licence-service/index.js')

const documentId = 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'

const licenceData = {
  marinePlanPolicies: [],
  marinePlanPolicySupportingDocuments: {
    documents: [{ documentId }],
    requiringDocuments: ['S-CC-1', 'S-CC-2']
  }
}

describe('#marinePlanPolicyDocumentPolicySubmitController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(licenceData)
    })
  })

  test('saves the selected policy links and redirects', async () => {
    const request = {
      params: { documentId },
      payload: {
        supportedPolicies: ['S-CC-1', 'S-CC-2'],
        'location-S-CC-1': 'section 4.2',
        'location-S-CC-2': 'pages 12 to 15'
      }
    }
    const h = { redirect: vi.fn() }

    await marinePlanPolicyDocumentPolicySubmitController.handler(request, h)

    expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
      request,
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_LINKS,
      {
        id: 'lic-1',
        documentId,
        policyLinks: [
          { policyCode: 'S-CC-1', location: 'section 4.2' },
          { policyCode: 'S-CC-2', location: 'pages 12 to 15' }
        ]
      }
    )
    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  })

  test('throws a failed save without redirecting', async () => {
    vi.mocked(authRequests.authenticatedPatchRequest).mockRejectedValueOnce(
      new Error('API down')
    )
    const h = { redirect: vi.fn() }

    await expect(
      marinePlanPolicyDocumentPolicySubmitController.handler(
        {
          params: { documentId },
          payload: { supportedPolicies: ['S-CC-1'], 'location-S-CC-1': 'a' }
        },
        h
      )
    ).rejects.toThrow('API down')
    expect(h.redirect).not.toHaveBeenCalled()
  })
})

describe('#marinePlanPolicyDocumentPolicyController', () => {
  test('redirects to the task list when no policies require documents', async () => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({ id: 'lic-1' })
    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue({
        marinePlanPolicies: [],
        marinePlanPolicySupportingDocuments: {
          documents: [{ documentId }],
          requiringDocuments: []
        }
      })
    })
    const h = { redirect: vi.fn(), view: vi.fn() }

    await marinePlanPolicyDocumentPolicyController.handler(
      { params: { documentId } },
      h
    )

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
    expect(h.view).not.toHaveBeenCalled()
  })
})
