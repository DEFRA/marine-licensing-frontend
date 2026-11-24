import { vi } from 'vitest'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marinePlanPolicyUnlinkSupportingDocumentsSubmitController } from '#src/server/marine-licence/marine-plan-policy-unlink-supporting-documents/controller.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')
vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#marinePlanPolicyUnlinkSupportingDocuments', () => {
  const policyCode = 'ABC-123'
  const marineLicence = {
    id: 'lic-1',
    projectName: 'Test Project'
  }

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(marineLicence)
    vi.spyOn(authRequests, 'authenticatedPatchRequest').mockResolvedValue({})
  })

  describe('submit controller', () => {
    test('calls the API with the correct parameters and redirects', async () => {
      const request = createMockRequest({ params: { policyCode } })
      const h = createMockH()
      h.redirect.mockReturnValue({ takeover: vi.fn() })

      await marinePlanPolicyUnlinkSupportingDocumentsSubmitController.handler(
        request,
        h
      )

      expect(authRequests.authenticatedPatchRequest).toHaveBeenCalledWith(
        request,
        expect.anything(),
        {
          id: 'lic-1',
          policyCode,
          requiresDocumentation: false
        }
      )
      expect(h.redirect).toHaveBeenCalledWith(
        '/marine-licence/marine-plan-policies'
      )
    })
  })
})
