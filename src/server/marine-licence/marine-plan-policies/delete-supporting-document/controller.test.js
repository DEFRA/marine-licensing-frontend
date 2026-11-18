import { vi } from 'vitest'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import { marinePlanPolicyDeleteSupportingDocumentSubmitController } from '#src/server/marine-licence/marine-plan-policies/delete-supporting-document/controller.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#marinePlanPolicyDeleteSupportingDocument submit', () => {
  const documentId = 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
  const marineLicence = {
    marinePlanPolicySupportingDocuments: {
      documents: [{ documentId }]
    }
  }

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue({
      id: 'lic-1'
    })
    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
    })
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  test('logs and throws when the API request fails', async () => {
    const request = createMockRequest({ params: { documentId } })
    vi.mocked(authRequests.authenticatedPatchRequest).mockRejectedValue(
      new Error('API Error')
    )

    await expect(
      marinePlanPolicyDeleteSupportingDocumentSubmitController.handler(
        request,
        createMockH()
      )
    ).rejects.toThrow('Error deleting marine plan policy supporting document')
    expect(request.logger.error).toHaveBeenCalled()
  })
})
